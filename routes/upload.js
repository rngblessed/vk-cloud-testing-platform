const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, uploadController.uploadMiddleware, uploadController.uploadFile);

module.exports = router;
