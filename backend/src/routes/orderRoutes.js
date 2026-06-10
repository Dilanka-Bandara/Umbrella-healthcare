const express = require('express');
const router = express.Router();
const { getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

// Secure route: Requires user to be logged in
router.get('/my-orders', protect, getMyOrders);

module.exports = router;