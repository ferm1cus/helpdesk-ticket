const service = require('../services/ticketService');

exports.list = (req, res) => res.json(service.list(req.user, req.query));
exports.create = (req, res) => res.status(201).json({ ticket: service.create(req.user, req.body) });
exports.get = (req, res) => res.json({ ticket: service.get(req.user, Number(req.params.id)) });
exports.changeStatus = (req, res) =>
  res.json({ ticket: service.changeStatus(req.user, Number(req.params.id), req.body.status) });
exports.assign = (req, res) =>
  res.json({ ticket: service.assign(req.user, Number(req.params.id), req.body.assigneeId) });
exports.addComment = (req, res) =>
  res.status(201).json({ comments: service.addComment(req.user, Number(req.params.id), req.body.body) });
