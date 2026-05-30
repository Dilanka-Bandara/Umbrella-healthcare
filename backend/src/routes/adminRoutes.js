const express = require('express');
const router = express.Router();
const { getPendingDoctors, approveDoctor } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware'); 

// GET /api/admin/pending-doctors
router.get('/pending-doctors', protect, getPendingDoctors);

// PUT /api/admin/approve-doctor/:id
router.put('/approve-doctor/:id', protect, approveDoctor);

module.exports = router;