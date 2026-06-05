const express = require('express');
const router = express.Router();
const {
  // original
  getDashboardStats,
  getDoctorsList,
  updateDoctorStatus,
  updateCommissionRate,
  getTransactions,
  // new
  getRevenueTrend,
  getMedicineBreakdown,
  updateMedicineCommission,
  updateDoctorPermission,
  getAllUsers,
  getAuditLog,
} = require('../controllers/adminController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

/*
 * Every admin route is locked down with protect + authorizeRole('admin').
 * This guarantees that only authenticated administrators can read sales,
 * moderate doctors, toggle permissions or change commission rates.
 */
const adminOnly = [protect, authorizeRole('admin')];

// --- Dashboard / analytics ---
router.get('/stats', adminOnly, getDashboardStats);
router.get('/revenue-trend', adminOnly, getRevenueTrend);
router.get('/medicines', adminOnly, getMedicineBreakdown);
router.put('/medicines/:id/commission', adminOnly, updateMedicineCommission);

// --- Doctor moderation & permissions ---
router.get('/doctors', adminOnly, getDoctorsList);
router.put('/doctors/:id/status', adminOnly, updateDoctorStatus);
router.put('/doctors/:id/permission', adminOnly, updateDoctorPermission);

// --- Commission engine ---
router.post('/settings/commission', adminOnly, updateCommissionRate);

// --- Transactions / sales monitoring ---
router.get('/transactions', adminOnly, getTransactions);

// --- Users & audit ---
router.get('/users', adminOnly, getAllUsers);
router.get('/audit-log', adminOnly, getAuditLog);

module.exports = router;