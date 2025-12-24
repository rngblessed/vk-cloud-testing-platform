const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { verifyToken, isTeacher } = require('../middleware/auth');

router.get('/', testController.getAllTests);
router.post('/', verifyToken, isTeacher, testController.createTest);
router.get('/:id', testController.getTestById);
router.delete('/:id', verifyToken, isTeacher, testController.deleteTest);

module.exports = router;
