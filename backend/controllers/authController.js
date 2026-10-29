const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const Users = require('../models/userModel');
const Audit = require('../models/auditModel');
const { AppError } = require('../middleware/errorHandler');

const sign = (user) => jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '8h' });

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (Users.findByEmail(email)) throw new AppError(409, 'Email is already registered');
  // Public sign-up always creates an employee; privileged roles are created by an admin.
  const id = Users.create({ name, email, passwordHash: bcrypt.hashSync(password, 10), role: 'employee' });
  Audit.log(id, 'USER_REGISTERED', 'user', id, { email });
  const user = Users.findById(id);
  res.status(201).json({ token: sign(user), user });
};

exports.login = (req, res) => {
  const row = Users.findByEmail(req.body.email || '');
  if (!row || !bcrypt.compareSync(String(req.body.password || ''), row.password_hash))
    throw new AppError(401, 'Invalid email or password');
  Audit.log(row.id, 'LOGIN', 'user', row.id, {});
  res.json({ token: sign(row), user: Users.findById(row.id) });
};

exports.me = (req, res) => res.json({ user: req.user });
