const express = require('express');
const router = express.Router();
const {
  submitCredential,
  getMyVerification,
  getVerificationQueue,
  getApplicantDetail,
  decideVerification,
  getVerificationAudit,
} = require('../controllers/verificationController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const adminOnly = [protect, authorizeRole('admin')];

/* ---------------- DOCTOR SIDE ---------------- */
// A logged-in doctor submits an extra proof document and checks their state.
router.post('/credentials', protect, authorizeRole('doctor'), submitCredential);
router.get('/me', protect, authorizeRole('doctor'), getMyVerification);

/* ---------------- ADMIN SIDE ----------------- */
router.get('/queue', adminOnly, getVerificationQueue);
router.get('/audit/log', adminOnly, getVerificationAudit);
router.get('/:id', adminOnly, getApplicantDetail);
router.put('/:id/decision', adminOnly, decideVerification);

module.exports = router;