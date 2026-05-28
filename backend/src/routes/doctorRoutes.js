const express = require('express');
const router = express.Router();
const { getMyPatients } = require('../controllers/doctorController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// GET /api/doctors/my-patients
// Protected: Only logged-in DOCTORS can access this
router.get('/my-patients', protect, authorizeRole('doctor'), getMyPatients);

module.exports = router;