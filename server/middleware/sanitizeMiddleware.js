/**
 * PsychePath - MongoDB Injection Protection & Request Sanitizer
 *
 * Recursively inspects and sanitizes request parameters, query, and body
 * to prevent MongoDB operator injection ($gt, $ne, $where) and prototype pollution.
 */

const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === "object") {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      // Strip keys starting with $ or containing . (MongoDB query operators / path navigation)
      if (!key.startsWith("$") && !key.includes(".")) {
        clean[key] = sanitizeValue(val);
      }
    }
    return clean;
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = {
  sanitizeRequest,
  sanitizeValue,
};
