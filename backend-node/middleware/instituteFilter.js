// Middleware to add institute context to requests
// This middleware should be used after the auth middleware

exports.addInstituteContext = (req, res, next) => {
  // req.user is set by the auth middleware
  if (req.user && req.user.institute_id) {
    // Add institute_id to request for easy access in controllers
    req.institute_id = req.user.institute_id;
    next();
  } else {
    return res.status(403).json({
      message: 'No institute context found. Please ensure you are properly authenticated.'
    });
  }
};

// Helper function to create institute-scoped query
// Usage: const whereClause = instituteScope(req, { status: 'active' });
exports.instituteScope = (req, additionalWhere = {}) => {
  if (!req.institute_id) {
    throw new Error('Institute context not found in request');
  }

  return {
    ...additionalWhere,
    institute_id: req.institute_id
  };
};
