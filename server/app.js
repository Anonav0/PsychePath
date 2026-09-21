const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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
const adminRoutes = require("./routes/adminRoutes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/errorMiddleware");
const {
  authLimiter,
  aiLimiter,
  submissionLimiter,
  globalLimiter,
} = require("./middleware/rateLimitMiddleware");
const { sanitizeRequest } = require("./middleware/sanitizeMiddleware");

const app = express();

// HTTP Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Managed by frontend Next.js headers
  }),
);

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

// Global API rate limiting
app.use(globalLimiter);

// Body parsing with safe size limits (100kb)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Request parameter and payload sanitization against MongoDB injection
app.use(sanitizeRequest);

// API route mounts with endpoint-specific rate limits
app.use("/api/health", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts/:attemptId/submit", submissionLimiter);
app.use("/api/attempts", attemptRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/recommendations", aiLimiter, recommendationRoutes);
app.use("/api/learning-path", aiLimiter, learningPathRoutes);
app.use("/api/learning-paths", aiLimiter, learningPathRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
