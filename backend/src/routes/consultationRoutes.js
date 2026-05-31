const express = require('express');
const router = express.Router();
const { getMyPatients, getPatientDirectory } = require('../controllers/doctorController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Route 1: Get active waiting room patients
router.get('/my-patients', protect, authorizeRole('doctor'), getMyPatients);

// Route 2: Get permanent historical patient directory
router.get('/directory', protect, authorizeRole('doctor'), getPatientDirectory);

module.exports = router;