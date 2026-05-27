const express = require('express');
const router = express.Router();

// 1. Import all three functions on a SINGLE line
const { connectPatient, saveConsultation, updateConsultation, prescribeMedicine } = require('../controllers/consultationController');

// 2. Import both Security Guards
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Route 1: Connect to patient 
router.post('/connect', protect, authorizeRole('doctor'), connectPatient);

// Route 2: Save the record 
router.post('/record', protect, authorizeRole('doctor'), saveConsultation);

// Route 3: Update an existing record 
router.put('/record/:id', protect, authorizeRole('doctor'), updateConsultation);

// Route 4: Prescribe a specific medicine from the DB (Only verified doctors)
router.post('/record/:id/prescribe', protect, authorizeRole('doctor'), prescribeMedicine);

module.exports = router;