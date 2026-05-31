const express = require('express');
const router = express.Router();
const { connectDoctor, getMyDoctors, getMyHistory } = require('../controllers/patientController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/connect-doctor', protect, connectDoctor);
router.get('/my-doctors', protect, getMyDoctors);

// 🚨 NEW: Expose the history route
router.get('/my-history', protect, getMyHistory);

module.exports = router;