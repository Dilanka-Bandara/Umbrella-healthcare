const express = require('express');
const router = express.Router();
const { connectDoctor } = require('../controllers/patientController');

// FIX: Added the 's' to 'middlewares'
const { protect } = require('../middlewares/authMiddleware');

// POST /api/patients/connect-doctor
router.post('/connect-doctor', protect, connectDoctor);

module.exports = router;