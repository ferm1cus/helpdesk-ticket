const express = require('express');
// const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorHandler');
require('./models/seed').seedAdmin();

const app = express();
// app.use(cors());
app.use(express.json());

// Request logging (silenced during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
  });
}

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api', notFound);

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(errorHandler);

module.exports = app;
