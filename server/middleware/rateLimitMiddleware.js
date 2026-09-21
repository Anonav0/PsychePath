/**
 * PsychePath - Rate Limiting Middleware
 *
 * Protects sensitive endpoints against brute-force and resource exhaustion attacks.
 * Automatically bypassed during automated test suite execution (NODE_ENV === 'test').
 */

const rateLimit = require("express-rate-limit");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Standard 429 handler formatting response according to PsychePath API contract
 */
const rateLimitHandler = (req, res, next, options) => {
  return errorResponse(res, {
    statusCode: 429,
    message: options.message || "Too many requests. Please try again later.",
    errorCode: "RATE_LIMIT_EXCEEDED",
  });
};

const isTestEnv = () => process.env.NODE_ENV === "test";

/**
 * Strict rate limiter for authentication mutations (login, registration)
 * 30 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
  handler: rateLimitHandler,
  skip: isTestEnv,
});

/**
 * Rate limiter for resource-intensive recommendation & AI path generation endpoints
 * 30 requests per minute per IP
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message:
    "Recommendation generation rate limit exceeded. Please wait a moment.",
  handler: rateLimitHandler,
  skip: isTestEnv,
});

/**
 * Rate limiter for final assessment submissions
 * 30 attempts per minute per IP
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Assessment submission rate limit exceeded. Please wait a moment.",
  handler: rateLimitHandler,
  skip: isTestEnv,
});

/**
 * General application API rate limiter
 * 300 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP. Please try again later.",
  handler: rateLimitHandler,
  skip: isTestEnv,
});

module.exports = {
  authLimiter,
  aiLimiter,
  submissionLimiter,
  globalLimiter,
};
