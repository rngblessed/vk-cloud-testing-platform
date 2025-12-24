const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { verifyToken, isTeacher } = require('../middleware/auth');

router.post('/', verifyToken, isTeacher, questionController.addQuestion);
router.post('/options', verifyToken, isTeacher, questionController.addAnswerOptions);
router.get('/test/:test_id', questionController.getTestQuestions);

module.exports = router;
