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

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error server-side for debugging outside of automated tests
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

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

  // Handle CORS errors or custom operational errors
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? "Internal server error"
      : err.message || "An unexpected error occurred";
  const errorCode =
    err.errorCode ||
    (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");

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
