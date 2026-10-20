import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/swagger.js';
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import expenseRoutes from "./routes/expense.js";
import contactRoutes from "./routes/contact.js";
import budgetRoutes from "./routes/budget.js";
import userRoutes from "./routes/user.js";
import rewardRoutes from "./routes/reward.js";
import roomRoutes from "./routes/room.js";

dotenv.config();

// Connect to MongoDB (handles serverless connection caching inside db.js)
connectDB();

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

// Flexible CORS setup for both local development and production
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? true // Allow production frontend domains (or specify your frontend URL here)
      : ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.use("/api/auth", authRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/reward", rewardRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.send("API is running....");
});

app.use(notFound);
app.use(errorHandler);

// Only listen locally if not running in a serverless environment like Vercel
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
  });
}

// Export app for Vercel serverless deployment
export default app;