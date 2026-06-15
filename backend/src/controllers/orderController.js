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

// @desc    Get ALL orders for the Staff Dashboard
// @route   GET /api/orders
// @access  Private (Pharmacists & Admins Only)
const getAllOrders = async (req, res) => {
  try {
    const query = `
      SELECT o.id, o.total_amount, o.status, o.shipping_address, o.courier_tracking_id, o.created_at, 
             u.full_name as patient_name, u.email as patient_email
      FROM public.orders o
      JOIN public.users u ON o.patient_id = u.id
      ORDER BY o.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch All Orders Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching orders' });
  }
};

// @desc    Update order status and tracking ID
// @route   PUT /api/orders/:id/status
// @access  Private (Pharmacists & Admins Only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, courier_tracking_id } = req.body;

    const updateQuery = `
      UPDATE public.orders 
      SET status = $1, 
          courier_tracking_id = COALESCE($2, courier_tracking_id), 
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    
    // Convert undefined to null for Postgres
    const tracking = courier_tracking_id ? courier_tracking_id : null;
    
    const result = await pool.query(updateQuery, [status, tracking, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order updated successfully!', order: result.rows[0] });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};





module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
};