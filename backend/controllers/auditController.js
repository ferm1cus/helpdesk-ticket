const Audit = require('../models/auditModel');

exports.list = (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit) || 20, 1), 100);
  const { rows, total } = Audit.list(limit, (page - 1) * limit);
  res.json({ data: rows, page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) });
};
