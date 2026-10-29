const db = require('./db');

module.exports = {
  log: (userId, action, entity, entityId, details = {}) =>
    db.prepare('INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, action, entity, entityId, JSON.stringify(details)),
  list(limit, offset) {
    const total = db.prepare('SELECT COUNT(*) AS c FROM audit_log').get().c;
    const rows = db.prepare(`SELECT l.*, u.name AS user_name FROM audit_log l
      LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT ? OFFSET ?`).all(limit, offset);
    return { rows, total };
  },
};
