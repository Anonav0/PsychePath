const jwt = require("jsonwebtoken");
const config = require("../config");
const { User } = require("../models");

/**
 * Generates a signed JWT token containing minimal user claims
 * @param {Object} user - User document
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }

  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Registers a new student user
 * @param {Object} data - Registration payload
 * @returns {Promise<Object>} User object and JWT token
 */
const register = async ({ firstName, lastName, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check whether email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error(
      "An account with this email address already exists",
    );
    error.statusCode = 409;
    error.errorCode = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  // Enforce role = 'STUDENT' strictly (prevent role tampering from client requests)
  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    password,
    role: "STUDENT",
    isActive: true,
  });

  const token = generateToken(user);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Authenticates user credentials and generates JWT
 * @param {Object} data - Login credentials
 * @returns {Promise<Object>} Authenticated user and JWT token
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Query user with password included for verification
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  // Use generic credential error to prevent account enumeration
  if (!user || !user.isActive) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.errorCode = "INVALID_CREDENTIALS";
    throw error;
  }

  // Compare candidate password with stored bcrypt hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.errorCode = "INVALID_CREDENTIALS";
    throw error;
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Retrieves the currently authenticated user by ID
 * @param {string} userId - User ObjectId
 * @returns {Promise<Object>} Safe user representation
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user || !user.isActive) {
    const error = new Error("User not found or account is deactivated");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  return user.toJSON();
};

module.exports = {
  generateToken,
  register,
  login,
  getCurrentUser,
};
