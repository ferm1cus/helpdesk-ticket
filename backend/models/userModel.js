const db = require('./db');
const PUBLIC = 'id, name, email, role, created_at';

module.exports = {
  create: ({ name, email, passwordHash, role }) =>
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.trim().toLowerCase(), passwordHash, role).lastInsertRowid,
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase()),
  findById: (id) => db.prepare(`SELECT ${PUBLIC} FROM users WHERE id = ?`).get(id),
  list: () => db.prepare(`SELECT ${PUBLIC} FROM users ORDER BY id`).all(),
  listByRole: (role) => db.prepare(`SELECT ${PUBLIC} FROM users WHERE role = ? ORDER BY name`).all(role),
};
