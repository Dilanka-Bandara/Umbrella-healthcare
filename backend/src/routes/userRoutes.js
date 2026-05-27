const express = require('express');
const router = express.Router();

// 1. Import ALL user functions on a SINGLE line
const { registerUser, loginUser, updateProfilePicture } = require('../controllers/userController');

// 2. Import the Security Guard for the profile picture
const { protect } = require('../middlewares/authMiddleware');

// Route 1: Register
router.post('/register', registerUser);

// Route 2: Login
router.post('/login', loginUser);

// Route 3: View Profile
router.get('/profile', protect, (req, res) => {
    res.status(200).json({ 
        message: 'Welcome to your private dashboard!',
        user_details: req.user 
    });
});

// Route 4: Update Profile Picture (Sprint 1)
router.put('/profile-picture', protect, updateProfilePicture);

module.exports = router;