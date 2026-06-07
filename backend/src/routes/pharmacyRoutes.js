const express = require('express');
const router = express.Router();
const { getMyCart, processCheckout, getInventory } = require('../controllers/pharmacyController');
const { protect } = require('../middlewares/authMiddleware');

// 🚨 PUBLIC E-COMMERCE ROUTE: Anyone can view the catalog
router.get('/inventory', getInventory);

// 🔒 SECURE MEDICAL ROUTES: Requires Login
router.get('/my-cart', protect, getMyCart);
router.post('/checkout', protect, processCheckout);

module.exports = router;