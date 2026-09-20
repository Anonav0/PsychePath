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
  isProduction: process.env.NODE_ENV === "production",
};

// Fail fast if JWT_SECRET is missing in development or production
if (!config.jwtSecret && process.env.NODE_ENV !== "test") {
  console.error(
    "[Config Warning] JWT_SECRET is not set in environment variables.",
  );
}

module.exports = config;
