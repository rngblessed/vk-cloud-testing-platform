const { Pool } = require('pg');
const logger = require('../config/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

exports.getAllTests = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { title, description, time_limit } = req.body;
    const result = await pool.query(
      'INSERT INTO tests (title, description, time_limit, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, time_limit, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);
    const questions = await pool.query('SELECT * FROM questions WHERE test_id = $1 ORDER BY order_num', [testId]);
    
    res.json({ test: test.rows[0], questions: questions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
 
    const testCheck = await pool.query(
      'SELECT created_by FROM tests WHERE id = $1',
      [id]
    );
    
    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Тест не найден' });
    }

    await pool.query('DELETE FROM tests WHERE id = $1', [id]);
    
    logger.info(`Test ${id} deleted by user ${userId}`);
    res.json({ message: 'Тест удален' });
  } catch (err) {
    logger.error('Delete test error:', err);
    res.status(500).json({ error: err.message });
  }
};
