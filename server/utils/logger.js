/**
 * PsychePath - Centralized Structured Logger
 *
 * Provides leveled, structured logging with automatic redaction of sensitive
 * information (passwords, tokens, API keys) and test-environment suppression.
 */

const config = require("../config");

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "jwt",
  "secret",
  "apikey",
  "geminiapikey",
  "authorization",
  "bearer",
  "cookie",
]);

/**
 * Deeply redacts sensitive keys from an object or array
 */
const redactSensitiveData = (data, depth = 0) => {
  if (depth > 5 || !data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = redactSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const safeMeta = redactSensitiveData(meta);
  return {
    timestamp,
    level,
    message,
    ...(Object.keys(safeMeta).length > 0 ? { meta: safeMeta } : {}),
  };
};

const logger = {
  info: (message, meta) => {
    if (process.env.NODE_ENV === "test") return;
    console.log(JSON.stringify(formatMessage("INFO", message, meta)));
  },

  warn: (message, meta) => {
    if (process.env.NODE_ENV === "test") return;
    console.warn(JSON.stringify(formatMessage("WARN", message, meta)));
  },

  error: (message, meta) => {
    if (process.env.NODE_ENV === "test") return;
    console.error(JSON.stringify(formatMessage("ERROR", message, meta)));
  },

  debug: (message, meta) => {
    if (process.env.NODE_ENV === "test" || config.isProduction) return;
    console.debug(JSON.stringify(formatMessage("DEBUG", message, meta)));
  },

  redact: redactSensitiveData,
};

module.exports = logger;
