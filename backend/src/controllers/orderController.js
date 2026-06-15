const db = require('../config/db');

// ==========================================
// 🚨 PATIENT FUNCTIONS (Purchasing)
// ==========================================

// @desc    Process payment and create a new order
// @route   POST /api/orders
// @access  Private (Patients Only)
const createOrder = async (req, res) => {
  const client = await db.connect(); // Start a secure database transaction

  try {
    const { total_amount, shipping_address, rxItems, otcItems } = req.body;
    const patient_id = req.user.id;

    await client.query('BEGIN'); // 🚨 START TRANSACTION

    // 1. Create the Main Order Record
    const orderQuery = `
      INSERT INTO public.orders (patient_id, total_amount, shipping_address, status)
      VALUES ($1, $2, $3, 'processing')
      RETURNING id;
    `;
    const orderResult = await client.query(orderQuery, [patient_id, total_amount, shipping_address]);
    const orderId = orderResult.rows[0].id;

    // 2. Process Prescription (Rx) Items
    if (rxItems && rxItems.length > 0) {
      for (const item of rxItems) {
        await client.query(`
          INSERT INTO public.order_items (order_id, prescription_id, quantity, price_at_purchase)
          VALUES ($1, $2, $3, $4)
        `, [orderId, item.prescription_id, item.buy_quantity, item.price]);
      }
    }

    // 3. Process Over-The-Counter (OTC) Items
    if (otcItems && otcItems.length > 0) {
      for (const item of otcItems) {
        const medQuery = await client.query('SELECT id FROM public.medicines WHERE name = $1', [item.name]);
        const productId = medQuery.rows.length > 0 ? medQuery.rows[0].id : null;

        await client.query(`
          INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
          VALUES ($1, $2, $3, $4)
        `, [orderId, productId, item.quantity, item.price]);

        // Reduce the stock quantity in the pharmacy inventory!
        if (productId) {
          await client.query(`
            UPDATE public.medicines 
            SET stock_quantity = stock_quantity - $1 
            WHERE id = $2
          `, [item.quantity, productId]);
        }
      }
    }

    await client.query('COMMIT'); // 🚨 SAVE EVERYTHING!

    res.status(201).json({
      success: true,
      message: 'Payment successful and order created!',
      orderId: orderId
    });

  } catch (error) {
    await client.query('ROLLBACK'); // 🚨 ERROR OCCURRED! Undo everything
    console.error('Order Processing Error:', error);
    res.status(500).json({ success: false, message: 'Payment failed. Order cancelled.' });
  } finally {
    client.release();
  }
};

// @desc    Get all orders for the logged-in patient
// @route   GET /api/orders/my-orders
// @access  Private (Patients Only)
const getMyOrders = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const query = `
      SELECT id, total_amount, status, shipping_address, courier_tracking_id, created_at 
      FROM public.orders 
      WHERE patient_id = $1 
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [patient_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// ==========================================
// 🚨 STAFF FUNCTIONS (Fulfillment)
// ==========================================

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
    const result = await db.query(query);
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
    
    const result = await db.query(updateQuery, [status, tracking, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order updated successfully!', order: result.rows[0] });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

// Export ALL 4 functions
module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
};