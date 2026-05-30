const express = require('express');
const router = express.Router();

const { connectPatient, saveConsultation, updateConsultation, prescribeMedicine, getPatientHistory } = require('../controllers/consultationController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

router.post('/connect', protect, authorizeRole('doctor'), connectPatient);
router.post('/record', protect, authorizeRole('doctor'), saveConsultation);
router.put('/record/:id', protect, authorizeRole('doctor'), updateConsultation);
router.post('/record/:id/prescribe', protect, authorizeRole('doctor'), prescribeMedicine);

// 🚨 NEW: Fetch history route
router.get('/history/:patientId', protect, authorizeRole('doctor'), getPatientHistory);

module.exports = router;