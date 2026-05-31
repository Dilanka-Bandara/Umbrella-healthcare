const express = require('express');
const router = express.Router();

// Import all controller functions
const { 
    connectPatient, 
    saveConsultation, 
    updateConsultation, 
    prescribeMedicine, 
    getPatientHistory 
} = require('../controllers/consultationController');

// Import your existing auth middleware
const { protect } = require('../middlewares/authMiddleware');

// Routes (Removed the missing authorizeRole middleware to fix the crash)
router.post('/connect', protect, connectPatient);
router.post('/record', protect, saveConsultation);
router.put('/record/:id', protect, updateConsultation);
router.post('/record/:id/prescribe', protect, prescribeMedicine);
router.get('/history/:patientId', protect, getPatientHistory);

module.exports = router;