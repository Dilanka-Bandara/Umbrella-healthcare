const express = require('express');
const router = express.Router();
const { connectDoctor, getMyDoctors } = require('../controllers/patientController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/connect-doctor', protect, connectDoctor);

// 🚨 UPGRADED: Changed to /my-doctors (plural)
router.get('/my-doctors', protect, getMyDoctors);

module.exports = router;