module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "utils/apiResponse.js",
    "!**/node_modules/**",
  ],
};
