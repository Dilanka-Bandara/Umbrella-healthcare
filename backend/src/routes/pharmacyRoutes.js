const express = require('express');
const router = express.Router();
const { getMyCart, processCheckout } = require('../controllers/pharmacyController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/my-cart', protect, getMyCart);
router.post('/checkout', protect, processCheckout);

module.exports = router;