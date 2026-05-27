const express = require('express');
const router = express.Router();
const { connectPatient, saveConsultation } = require('../controllers/consultationController');

// Import both Security Guards!
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Route 1: Connect to patient (Only Doctors can do this)
router.post('/connect', protect, authorizeRole('doctor'), connectPatient);

// Route 2: Save the record (Only Doctors can do this)
router.post('/record', protect, authorizeRole('doctor'), saveConsultation);

module.exports = router;