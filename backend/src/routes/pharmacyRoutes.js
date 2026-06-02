const express = require('express');
const router = express.Router();
const { getMyCart, processCheckout, getInventory } = require('../controllers/pharmacyController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/my-cart', protect, getMyCart);
router.post('/checkout', protect, processCheckout);
// 🚨 NEW: Added the inventory route for the Doctor!
router.get('/inventory', protect, getInventory);

module.exports = router;