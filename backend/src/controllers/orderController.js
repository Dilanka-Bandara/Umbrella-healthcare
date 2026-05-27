const db = require('../config/db');

// @desc    Patient views their own order history and tracking status
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const orders = await db.query(
            `SELECT p.*, m.name as medicine_name, m.price 
             FROM patient_purchases p
             JOIN medicines m ON p.medicine_id = m.id
             WHERE p.patient_id = $1 ORDER BY p.purchase_date DESC`,
            [patient_id]
        );
        res.status(200).json(orders.rows);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ message: 'Server Error tracking orders.' });
    }
};

// @desc    Admin updates the shipping status (e.g., Shipped, Delivered)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const order_id = req.params.id;
        const { status } = req.body;

        const updatedOrder = await db.query(
            `UPDATE patient_purchases SET status = $1 WHERE id = $2 RETURNING *`,
            [status, order_id]
        );

        res.status(200).json({
            message: `Order marked as ${status}!`,
            order: updatedOrder.rows[0]
        });
    } catch (error) {
        console.error('Error updating status:', error.message);
        res.status(500).json({ message: 'Server Error updating shipping.' });
    }
};

module.exports = { getMyOrders, updateOrderStatus };