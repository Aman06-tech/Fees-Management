const rateLimit = require('express-rate-limit');

// Strict rate limiter for login and registration
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  skip: (req) => req.method === 'OPTIONS', // Skip CORS preflight requests
});

// More lenient limiter for OAuth operations (Google, Facebook, etc.)
// OAuth providers already implement their own rate limiting
exports.oauthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Allow more attempts for OAuth flows
  message: 'Too many OAuth attempts, please try again shortly',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => req.method === 'OPTIONS', // Skip CORS preflight requests
});

// More lenient limiter for other auth operations
exports.generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip CORS preflight requests
});
