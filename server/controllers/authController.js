const authService = require("../services/authService");
const { successResponse } = require("../utils/apiResponse");

/**
 * Handle user registration: POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const result = await authService.register({
      firstName,
      lastName,
      email,
      password,
    });

    return successResponse(res, {
      statusCode: 201,
      message: "User registered successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle user login: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return successResponse(res, {
      statusCode: 200,
      message: "Login successful",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle fetching authenticated user: GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);

    return successResponse(res, {
      statusCode: 200,
      message: "Authenticated user profile retrieved",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verification test endpoint for STUDENT role: GET /api/auth/student-test
 */
const studentTest = (req, res) => {
  return successResponse(res, {
    statusCode: 200,
    message: "Authorized: Student verification endpoint accessed successfully",
    data: {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

/**
 * Verification test endpoint for ADMIN role: GET /api/auth/admin-test
 */
const adminTest = (req, res) => {
  return successResponse(res, {
    statusCode: 200,
    message:
      "Authorized: Administrator verification endpoint accessed successfully",
    data: {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
  studentTest,
  adminTest,
};
