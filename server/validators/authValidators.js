const { errorResponse } = require("../utils/apiResponse");

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Middleware validator for user registration requests
 */
const validateRegister = (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (
    !firstName ||
    typeof firstName !== "string" ||
    firstName.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "First name is required and must be a non-empty string",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (firstName.trim().length > 50) {
    return errorResponse(res, {
      statusCode: 400,
      message: "First name cannot exceed 50 characters",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (
    !lastName ||
    typeof lastName !== "string" ||
    lastName.trim().length === 0
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Last name is required and must be a non-empty string",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (lastName.trim().length > 50) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Last name cannot exceed 50 characters",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return errorResponse(res, {
      statusCode: 400,
      message: "A valid email address is required",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Password must be at least 8 characters long",
      errorCode: "VALIDATION_ERROR",
    });
  }

  next();
};

/**
 * Middleware validator for user login requests
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return errorResponse(res, {
      statusCode: 400,
      message: "A valid email address is required",
      errorCode: "VALIDATION_ERROR",
    });
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Password is required",
      errorCode: "VALIDATION_ERROR",
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
