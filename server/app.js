const express = require("express");
const cors = require("cors");
const config = require("./config");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const profileRoutes = require("./routes/profileRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const learningPathRoutes = require("./routes/learningPathRoutes");
const progressRoutes = require("./routes/progressRoutes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

// Configure CORS driven by CLIENT_URL environment setting
const allowedOrigins = config.clientUrl.split(",").map((url) => url.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const corsError = new Error(
        `CORS policy violation: Origin ${origin} not allowed`,
      );
      corsError.statusCode = 403;
      corsError.errorCode = "CORS_FORBIDDEN";
      return callback(corsError);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing with safe limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// API route mounts
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/learning-path", learningPathRoutes);
app.use("/api/learning-paths", learningPathRoutes);
app.use("/api/progress", progressRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
