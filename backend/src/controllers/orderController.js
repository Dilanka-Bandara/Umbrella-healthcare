const db = require('../config/db');

// @desc    Get all orders belonging to the logged-in patient
// @route   GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
    try {
        // Securely fetch only the orders for the authenticated user
        const orders = await db.query(
            `SELECT id, total_amount, status, delivery_address, created_at 
             FROM orders 
             WHERE patient_id = $1 
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.status(200).json(orders.rows);
    } catch (error) {
        console.error("Order fetch error:", error);
        res.status(500).json({ message: 'Error fetching order history' });
    }
};

module.exports = { getMyOrders };