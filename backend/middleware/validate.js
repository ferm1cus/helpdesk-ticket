const { AppError } = require('./errorHandler');
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'Other'];
const ROLES = ['employee', 'agent', 'admin'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const required = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => req.body[f] === undefined || String(req.body[f]).trim() === '');
  next(missing.length ? new AppError(400, `Missing fields: ${missing.join(', ')}`) : undefined);
};

const userRules = (req, res, next) => {
  const { email, password, role } = req.body;
  if (!EMAIL.test(email)) return next(new AppError(400, 'Invalid email address'));
  if (String(password).length < 8) return next(new AppError(400, 'Password must be at least 8 characters'));
  if (role !== undefined && !ROLES.includes(role)) return next(new AppError(400, `Role must be one of: ${ROLES.join(', ')}`));
  next();
};

const ticketRules = (req, res, next) => {
  const { title, priority, category } = req.body;
  if (String(title).length > 120) return next(new AppError(400, 'Title must be 120 characters or fewer'));
  if (!PRIORITIES.includes(priority)) return next(new AppError(400, `Priority must be one of: ${PRIORITIES.join(', ')}`));
  if (!CATEGORIES.includes(category)) return next(new AppError(400, `Category must be one of: ${CATEGORIES.join(', ')}`));
  next();
};

module.exports = {
  validateRegister: [required('name', 'email', 'password'), userRules],
  validateNewUser: [required('name', 'email', 'password', 'role'), userRules],
  validateTicket: [required('title', 'description', 'priority', 'category'), ticketRules],
  required,
};
