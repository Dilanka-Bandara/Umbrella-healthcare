const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// 🚨 PATIENT ROUTES (Purchasing)
router.post('/', protect, authorizeRole('patient'), createOrder);
router.get('/my-orders', protect, authorizeRole('patient'), getMyOrders);

// 🚨 STAFF ROUTES (Fulfillment)
router.get('/', protect, authorizeRole('admin', 'pharmacist'), getAllOrders);
router.put('/:id/status', protect, authorizeRole('admin', 'pharmacist'), updateOrderStatus);

module.exports = router;