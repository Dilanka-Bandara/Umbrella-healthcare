const express = require('express');
const router = express.Router();
const { addProduct, getInventory, getMyCart, processCheckout } = require('../controllers/pharmacyController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// 🚨 THE FIX: Use curly braces to match the universal export!
const { upload } = require('../middlewares/uploadMiddleware'); 

// ==========================================
// 🚨 PHARMACIST / ADMIN ROUTES
// ==========================================
// Add a new product 
router.post(
  '/inventory', 
  protect, 
  authorizeRole('pharmacist', 'admin'), 
  upload.single('image'), 
  addProduct
);

// ==========================================
// 🚨 PUBLIC / PATIENT ROUTES
// ==========================================
router.get('/inventory', getInventory);
router.get('/my-cart', protect, authorizeRole('patient'), getMyCart);
router.post('/checkout', protect, authorizeRole('patient'), processCheckout);

module.exports = router;