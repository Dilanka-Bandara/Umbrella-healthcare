const express = require('express');
const router = express.Router();
const { getDashboardStats, getDoctorsList, updateDoctorStatus, updateCommissionRate, getTransactions } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

// Add admin role checking middleware if you have one, otherwise protect is fine for now
router.get('/stats', protect, getDashboardStats);
router.get('/doctors', protect, getDoctorsList);
router.put('/doctors/:id/status', protect, updateDoctorStatus);
router.post('/settings/commission', protect, updateCommissionRate);
router.get('/transactions', protect, getTransactions);

module.exports = router;