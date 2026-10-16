import asyncHandler from 'express-async-handler'
import User from '../models/user.js'

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
  res.status(200).json(users)
}) 

// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Public
const getSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      userType: user.userType,
      profilePic: user.profilePic,
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

export {
  getUsers,
  getSingleUser,
}