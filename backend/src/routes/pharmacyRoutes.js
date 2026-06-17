const express = require('express');
const router = express.Router();
const { addProduct, getInventory, getMyCart, processCheckout } = require('../controllers/pharmacyController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// 🚨 IMPORT YOUR PERFECT UPLOAD MIDDLEWARE
// Note the curly braces { upload } because you exported an object!
const { upload } = require('../middlewares/uploadMiddleware'); 

// 🚨 PLUG IT IN: Add `upload.single('image')` right before `addProduct`
router.post(
  '/inventory', 
  protect, 
  authorizeRole('pharmacist', 'admin'), 
  upload.single('image'), // This tells Multer to look for a file named "image"
  addProduct
);

// ... your other pharmacy routes (cart, checkout, etc.)
router.get('/inventory', getInventory);
router.get('/my-cart', protect, authorizeRole('patient'), getMyCart);
router.post('/checkout', protect, authorizeRole('patient'), processCheckout);

module.exports = router;