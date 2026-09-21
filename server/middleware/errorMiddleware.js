const { errorResponse } = require("../utils/apiResponse");

/**
 * 404 handler for routes that are not defined
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: "ROUTE_NOT_FOUND",
  });
};

const logger = require("../utils/logger");

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error server-side via structured logger with sensitive data redacted
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    statusCode: err.statusCode || 500,
    errorCode: err.errorCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle malformed JSON in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid JSON payload in request body",
      errorCode: "INVALID_JSON",
    });
  }

  // Handle Mongoose CastError (invalid/malformed MongoDB ObjectId)
  if (err.name === "CastError") {
    return errorResponse(res, {
      statusCode: 400,
      message: `Invalid identifier format: ${err.value}`,
      errorCode: "INVALID_ID",
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return errorResponse(res, {
      statusCode: 400,
      message: `Validation error: ${details.join(", ")}`,
      errorCode: "VALIDATION_ERROR",
      data: details,
    });
  }

  // Handle MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "resource";
    return errorResponse(res, {
      statusCode: 409,
      message: `Duplicate entry: A record with that ${field} already exists`,
      errorCode: "DUPLICATE_RESOURCE",
    });
  }

  // Handle operational vs unexpected errors
  const statusCode = err.statusCode || 500;
  const is500 = statusCode >= 500;

  // Safe messaging in production to prevent leaking internal database schemas or stack traces
  const message = is500
    ? "An unexpected internal server error occurred. Please try again later."
    : err.message || "An unexpected error occurred";

  const errorCode =
    err.errorCode || (is500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");

  return errorResponse(res, {
    statusCode,
    message,
    errorCode,
    data: err.data,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
