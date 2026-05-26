const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

// Import the Security Guard
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// NEW: A protected route! The 'protect' guard stands in front of it.
router.get('/profile', protect, (req, res) => {
    // If the guard lets them through, send them this secret data:
    res.status(200).json({ 
        message: 'Welcome to your private dashboard!',
        user_details: req.user 
    });
});

module.exports = router;