const express = require('express');
const router = express.Router();
const { processCheckout } = require('../controllers/checkoutController');
const { protect } = require('../middlewares/authMiddleware');

// Route: Process a purchase (Must be logged in to buy)
router.post('/', protect, processCheckout);

module.exports = router;