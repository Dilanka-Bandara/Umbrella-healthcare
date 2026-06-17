const express = require('express');
const router = express.Router();
const { addProduct, getInventory, getMyCart, processCheckout } = require('../controllers/pharmacyController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// 🚨 THE FIX: Import 'upload' directly without the curly braces!
const upload = require('../middlewares/uploadMiddleware'); 

// ==========================================
// 🚨 PHARMACIST / ADMIN ROUTES
// ==========================================
// Add a new product (Catches the photo using upload.single)
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
// View all products in the storefront
router.get('/inventory', getInventory);

// Get Patient's active prescriptions (Cart)
router.get('/my-cart', protect, authorizeRole('patient'), getMyCart);

// Checkout and pay for medications
router.post('/checkout', protect, authorizeRole('patient'), processCheckout);

module.exports = router;