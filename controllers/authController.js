import asyncHandler from 'express-async-handler'
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import { generateToken, generateRefreshToken } from '../utils/generateToken.js'
import User from '../models/user.js'
import { RoomJoinRequest } from '../models/room.js'
import cloudinary from '../utils/cloudinary.js'

// Helper: Stream buffer directly to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'user_profiles' },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

// @desc    Authenticate or register user with Google OAuth
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential token is required');
  }

  try {
    // 1. Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub: googleId } = payload;

    if (!email) {
      res.status(400);
      throw new Error('Google account email not found');
    }

    // 2. Check if user already exists in database
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but didn't have a profile picture or Google metadata, update profile pic optionally
      if (!user.profilePic?.url && picture) {
        user.profilePic = { url: picture, public_id: '' };
        await user.save();
      }
    } else {
      // 3. If user doesn't exist, create a new user automatically
      // Generate a random secure temporary password since they use Google login
      const randomPassword = crypto.randomBytes(32).toString('hex');

      user = await User.create({
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        email,
        password: randomPassword, // Will be hashed by userSchema pre-save hook
        profilePic: {
          url: picture || '',
          public_id: '',
        },
        settings: {
          currency: 'USD',
          timezone: 'UTC',
          theme: 'light',
        },
      });
    }

    // 4. Respond with your standard app tokens and user info
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      userType: user.userType,
      token: generateToken(user),
      refreshToken: generateRefreshToken(user),
      settings: user.settings,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(401);
    throw new Error('Google authentication failed: ' + error.message);
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body

  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
      ...(rememberMe && { refreshToken: generateRefreshToken(user) }),
      settings: user.settings,
      profilePic: user.profilePic,
    })
  } else {
    res.status(401)
    throw new Error('Invalid email or password')
  }
})

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, isAdmin, userType } = req.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error('User already exists')
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    isAdmin,
    userType,
  })

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      userType: user.userType,
      token: generateToken(user),
      settings: user.settings,
      refreshToken: generateRefreshToken(user),
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})

// @desc    Refresh access token using a refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    res.status(401)
    throw new Error('Refresh Token is required')
  }

  try {
    // 1. Verify the refresh token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // 2. Find user by id from payload
    const user = await User.findById(decoded.id)

    if (!user) {
      res.status(401)
      throw new Error('Invalid Refresh Token - User not found')
    }

    // 3. Generate a brand new access token
    const newAccessToken = generateToken(user)

    res.status(200).json({
      token: newAccessToken,
    })
  } catch (error) {
    res.status(403)
    throw new Error('Invalid or expired refresh token')
  }
})

// @desc    Get user profile and settings
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      userType: user.userType,
      profilePic: user.profilePic,
      settings: user.settings || { currency: 'USD', theme: 'dark' }, // Include settings object
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Update user profile picture
// @route   PUT /api/auth/profile/pic
// @access  Private
const updateUserProfilePic = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error('Please upload an image file')
  }

  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Delete previous Cloudinary image if it exists
  if (user.profilePic?.public_id) {
    await cloudinary.uploader.destroy(user.profilePic.public_id)
  }

  const result = await uploadToCloudinary(req.file.buffer)

  user.profilePic = {
    url: result.secure_url,
    public_id: result.public_id,
  }

  const updatedUser = await user.save()

  res.status(200).json({
    message: 'Profile picture updated successfully',
    profilePic: updatedUser.profilePic,
  })
})

// @desc    Update user password
// @route   PUT /api/auth/change-password
// @access  Private
const changeUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  const isMatch = await user.matchPassword(currentPassword)

  if (!isMatch) {
    res.status(400)
    throw new Error('Current password is incorrect')
  }

  user.password = newPassword
  await user.save()

  res.status(200).json({ message: 'Password updated successfully' })
})

// @desc    Update user profile and settings
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  const { firstName, lastName, email, settings, currency } = req.body

  if (firstName) user.firstName = firstName
  if (lastName) user.lastName = lastName
  if (email) user.email = email

  // Ensure user.settings exists before updating
  if (!user.settings) {
    user.settings = {}
  }

  // Handle settings update (supports both nested object and direct currency field)
  if (settings) {
    if (settings.currency !== undefined) {
      user.settings.currency = settings.currency
    }
  } else if (currency !== undefined) {
    user.settings.currency = currency
  }

  const updatedUser = await user.save()

  res.status(200).json({
    _id: updatedUser._id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    userType: updatedUser.userType,
    profilePic: updatedUser.profilePic,
    settings: updatedUser.settings,
  })
})

// @desc    Get all room joining requests for logged in user
// @route   GET /api/auth/room-requests
// @access  Private
const getRoomJoiningRequests = asyncHandler(async (req, res) => {
  const requests = await RoomJoinRequest.find({ user: req.user._id, status: "pending" }).populate("room");
  res.status(200).json({ success: true, requests });
});

export {
  authUser,
  googleAuth,
  registerUser,
  refreshToken,
  getUserProfile,
  updateUserProfilePic,
  changeUserPassword,
  updateUserProfile,
  getRoomJoiningRequests
}