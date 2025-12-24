const { Pool } = require('pg');
const logger = require('../config/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Добавить вопрос к тесту
exports.addQuestion = async (req, res) => {
  try {
    const { test_id, question_text, question_type, points, correct_answer, image_url } = req.body;
    
    const result = await pool.query(
      'INSERT INTO questions (test_id, question_text, question_type, points, correct_answer, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [test_id, question_text, question_type || 'multiple_choice', points || 1, correct_answer, image_url || null]
    );
    
    logger.info(`Question added to test ${test_id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Add question error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Добавить варианты ответов
exports.addAnswerOptions = async (req, res) => {
  try {
    const { question_id, options } = req.body;
    
    const insertPromises = options.map(option => 
      pool.query(
        'INSERT INTO answer_options (question_id, option_text, is_correct) VALUES ($1, $2, $3) RETURNING *',
        [question_id, option.text, option.is_correct || false]
      )
    );
    
    const results = await Promise.all(insertPromises);
    res.status(201).json(results.map(r => r.rows[0]));
  } catch (err) {
    logger.error('Add options error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Получить вопросы теста
exports.getTestQuestions = async (req, res) => {
  try {
    const { test_id } = req.params;
    
    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY id',
      [test_id]
    );
    
    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (question) => {
        const options = await pool.query(
          'SELECT id, option_text FROM answer_options WHERE question_id = $1',
          [question.id]
        );
        return { ...question, options: options.rows };
      })
    );
    
    res.json(questionsWithOptions);
  } catch (err) {
    logger.error('Get questions error:', err);
    res.status(500).json({ error: err.message });
  }
};
