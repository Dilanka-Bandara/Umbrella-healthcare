const express = require('express');
const router = express.Router();
const { connectDoctor } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware'); 

// POST /api/patients/connect-doctor
router.post('/connect-doctor', protect, connectDoctor);

module.exports = router;