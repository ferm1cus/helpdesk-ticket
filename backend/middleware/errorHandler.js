class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const notFound = (req, res) => res.status(404).json({ error: 'Route not found' });
// Centralized error handler: known errors keep their status, unknown ones become 500.
const errorHandler = (err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
};
module.exports = { AppError, notFound, errorHandler };
