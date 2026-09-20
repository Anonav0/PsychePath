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
  // Always log error server-side for debugging
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Handle malformed JSON in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid JSON payload in request body",
      errorCode: "INVALID_JSON",
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
