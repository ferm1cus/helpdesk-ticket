require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  dbFile: process.env.DB_FILE || 'helpdesk.db',
};
