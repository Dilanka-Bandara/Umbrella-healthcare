const express = require('express');
const router = express.Router();

const { addMedicine, getAllMedicines } = require('../controllers/pharmacyController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Route 1: View Inventory (Logged in Doctors and Patients can view)
router.get('/medicines', protect, getAllMedicines);

// Route 2: Add to Inventory (Strictly ADMIN only!)
router.post('/medicines', protect, authorizeRole('admin'), addMedicine);

module.exports = router;