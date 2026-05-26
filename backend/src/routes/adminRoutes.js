const express = require('express');
const router = express.Router();
const { approveDoctor } = require('../controllers/adminController');

// Import our Security Guards
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// The route: Only accessible if logged in (protect) AND role is admin (authorizeRole)
router.put('/approve-doctor/:id', protect, authorizeRole('admin'), approveDoctor);

module.exports = router;