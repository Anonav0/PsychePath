/**
 * Formats and sends a standardized successful JSON response
 * @param {Object} res - Express response object
 * @param {Object} options
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} options.message - Human readable success message
 * @param {Object} [options.data] - Optional response payload
 */
const successResponse = (
  res,
  { statusCode = 200, message = "Success", data = undefined } = {},
) => {
  const payload = {
    success: true,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Formats and sends a standardized error JSON response
 * @param {Object} res - Express response object
 * @param {Object} options
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} options.message - Error message
 * @param {string} [options.errorCode] - Optional application error code
 */
const errorResponse = (
  res,
  {
    statusCode = 500,
    message = "Internal server error",
    errorCode = undefined,
  } = {},
) => {
  const payload = {
    success: false,
    message,
  };

  if (errorCode !== undefined) {
    payload.errorCode = errorCode;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
