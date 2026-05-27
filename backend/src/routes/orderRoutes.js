const express = require('express');
const router = express.Router();
const { getMyOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Route 1: Patients can track their boxes
router.get('/myorders', protect, getMyOrders);

// Route 2: Admins can update shipping statuses
router.put('/:id/status', protect, authorizeRole('admin'), updateOrderStatus);

module.exports = router;