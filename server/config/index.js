const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/psychepath",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "test"
      ? "test_jwt_secret_key_32_chars_long"
      : ""),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-flash-latest",
  geminiTimeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 15000,
  geminiMaxRetries: parseInt(process.env.GEMINI_MAX_RETRIES, 10) || 2,
  aiMaxCandidates: parseInt(process.env.AI_MAX_CANDIDATES, 10) || 10,
  isProduction: process.env.NODE_ENV === "production",
};

// Fail fast if JWT_SECRET is missing or insecure in production
if (config.isProduction) {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error(
      "[Fatal] In production, JWT_SECRET must be explicitly set and be at least 32 characters long.",
    );
  }
} else if (!config.jwtSecret && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Config Warning] JWT_SECRET is not set in environment variables. Generating fallback for development.",
  );
  config.jwtSecret = "dev_fallback_secret_must_be_overridden_in_env_file_12345";
}

module.exports = config;
