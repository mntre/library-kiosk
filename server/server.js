require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, seedDatabase } = require('./database');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Database initialization
initDB()
  .then(() => {
    console.log('Database initialized successfully');
    seedDatabase();
    startServer();
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

function startServer() {
  // API Routes
  const attendanceRouter = require('./routes/attendance');
  const adminRouter = require('./routes/admin');
  const programsRouter = require('./routes/programs');
  const studentsRouter = require('./routes/students');

  app.use('/api/attendance', attendanceRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/programs', programsRouter);
  app.use('/api/students', studentsRouter);

  // Serve index.html for any other routes (React router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Kiosk: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin`);
  });
}
