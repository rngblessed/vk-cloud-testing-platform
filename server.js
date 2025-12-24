const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const uploadRoutes = require('./routes/upload');
const questionRoutes = require('./routes/questions');

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/questions', questionRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      message: 'Server and DB connected',
      db_time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
