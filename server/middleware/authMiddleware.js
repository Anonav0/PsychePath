const jwt = require("jsonwebtoken");
const config = require("../config");
const { User } = require("../models");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Middleware to verify JWT token and attach authenticated user to req.user
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Authentication required",
      errorCode: "AUTH_REQUIRED",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Authentication required",
      errorCode: "AUTH_REQUIRED",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Verify current state against MongoDB (do not blindly trust cached JWT claims)
    const user = await User.findById(decoded.sub).select("-password");

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: "User no longer exists",
        errorCode: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Account is deactivated",
        errorCode: "ACCOUNT_DEACTIVATED",
      });
    }

    // Attach authenticated user identity to request
    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, {
      statusCode: 401,
      message: "Invalid or expired authentication token",
      errorCode: "INVALID_TOKEN",
    });
  }
};

/**
 * Middleware to enforce role-based access control (RBAC)
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'STUDENT'
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Authentication required",
        errorCode: "AUTH_REQUIRED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, {
        statusCode: 403,
        message: "You do not have permission to access this resource",
        errorCode: "FORBIDDEN",
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRole,
};
