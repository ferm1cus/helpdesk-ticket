const jwt = require('jsonwebtoken');
const config = require('../config');
const Users = require('../models/userModel');
const { AppError } = require('./errorHandler');

// Verifies the Bearer token and loads the user (so deleted users lose access immediately).
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'Authentication required'));
  try {
    const { id } = jwt.verify(token, config.jwtSecret);
    const user = Users.findById(id);
    if (!user) return next(new AppError(401, 'User no longer exists'));
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

// Role-based access control.
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError(403, 'You do not have permission for this action'));

module.exports = { authenticate, authorize };
