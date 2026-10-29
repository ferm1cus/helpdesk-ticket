const bcrypt = require('bcryptjs');
const Users = require('../models/userModel');
const Audit = require('../models/auditModel');
const { AppError } = require('../middleware/errorHandler');

exports.list = (req, res) => res.json({ data: Users.list() });
exports.agents = (req, res) => res.json({ data: Users.listByRole('agent') });

exports.create = (req, res) => {
  const { name, email, password, role } = req.body;
  if (Users.findByEmail(email)) throw new AppError(409, 'Email is already registered');
  const id = Users.create({ name, email, passwordHash: bcrypt.hashSync(password, 10), role });
  Audit.log(req.user.id, 'USER_CREATED', 'user', id, { email, role });
  res.status(201).json({ user: Users.findById(id) });
};
