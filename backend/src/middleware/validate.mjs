/**
 * Middleware helpers for request validation.
 * Each validator returns an Express middleware function.
 */

/**
 * Validate required fields are present and non-empty on req.body.
 * @param {string[]} fields
 */
export function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missing.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Validate that a numeric field is a positive integer.
 * @param {string} field
 * @param {object} [opts]
 * @param {number} [opts.min=1]
 */
export function positiveInt(field, { min = 1 } = {}) {
  return (req, res, next) => {
    const value = Number(req.body[field]);
    if (!Number.isInteger(value) || value < min) {
      return res.status(400).json({
        error: `'${field}' must be an integer greater than or equal to ${min}`,
      });
    }
    req.body[field] = value; // normalise to number
    next();
  };
}

/**
 * Validate that a date field parses to a valid date.
 * @param {string} field
 */
export function validDate(field) {
  return (req, res, next) => {
    const d = new Date(req.body[field]);
    if (isNaN(d.getTime())) {
      return res.status(400).json({
        error: `'${field}' must be a valid ISO date string`,
      });
    }
    next();
  };
}

/**
 * Validate that an email field looks like an email address.
 * @param {string} field
 */
export function validEmail(field) {
  return (req, res, next) => {
    const email = req.body[field];
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: `'${field}' must be a valid email address`,
      });
    }
    next();
  };
}
