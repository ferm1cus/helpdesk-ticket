const db = require('./db');

const JOINS = `FROM tickets t
  JOIN users u ON u.id = t.created_by
  LEFT JOIN users a ON a.id = t.assigned_to`;
const COLS = 't.*, u.name AS created_by_name, a.name AS assigned_to_name';

module.exports = {
  create: ({ title, description, priority, category, createdBy }) =>
    db.prepare('INSERT INTO tickets (title, description, priority, category, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(title, description, priority, category, createdBy).lastInsertRowid,

  findById: (id) => db.prepare(`SELECT ${COLS} ${JOINS} WHERE t.id = ?`).get(id),

  list(f, limit, offset) {
    const where = [];
    const params = [];
    const eq = (col, val) => { if (val) { where.push(`${col} = ?`); params.push(val); } };
    eq('t.created_by', f.createdBy);
    eq('t.status', f.status);
    eq('t.priority', f.priority);
    eq('t.category', f.category);
    eq('t.assigned_to', f.assignedTo);
    if (f.q) { where.push('(t.title LIKE ? OR t.description LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) AS c ${JOINS} ${w}`).get(...params).c;
    const rows = db.prepare(`SELECT ${COLS} ${JOINS} ${w} ORDER BY t.id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    return { rows, total };
  },

  updateStatus: (id, status, assignedTo) =>
    db.prepare("UPDATE tickets SET status = ?, assigned_to = ?, updated_at = datetime('now') WHERE id = ?").run(status, assignedTo, id),

  assign: (id, assignedTo) =>
    db.prepare("UPDATE tickets SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?").run(assignedTo, id),

  addComment: (ticketId, userId, body) =>
    db.prepare('INSERT INTO comments (ticket_id, user_id, body) VALUES (?, ?, ?)').run(ticketId, userId, body),

  comments: (ticketId) =>
    db.prepare(`SELECT c.id, c.body, c.created_at, u.name AS author, u.role AS author_role
      FROM comments c JOIN users u ON u.id = c.user_id WHERE c.ticket_id = ? ORDER BY c.id`).all(ticketId),
};
