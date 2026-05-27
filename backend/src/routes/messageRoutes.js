const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

// Route: Get conversation history with a specific user
router.get('/:otherUserId', protect, getChatHistory);

module.exports = router;