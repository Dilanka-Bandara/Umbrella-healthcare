const db = require('../config/db');

// 🔥 AUTO-MIGRATION: Adds Partial Fulfillment & Expiry columns
db.query(`
  ALTER TABLE consultation_prescriptions 
  ADD COLUMN IF NOT EXISTS total_quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS purchased_quantity INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
`).catch(() => console.log("DB check skipped"));

// @desc    Get all active prescriptions (Not fully bought, not expired)
// @route   GET /api/pharmacy/my-cart
const getMyCart = async (req, res) => {
    try {
        const patient_id = req.user.id;

        // 🚨 ENTERPRISE LOGIC: Only fetch if valid_until is in the future AND purchased < total
        const cartItems = await db.query(
            `SELECT cp.id as prescription_id, cp.instructions, cp.status, 
                    cp.total_quantity, cp.purchased_quantity, cp.valid_until,
                    m.id as medicine_id, m.name as medicine_name, m.price, m.type,
                    c.created_at as prescribed_on, u.full_name as doctor_name
             FROM consultation_prescriptions cp
             JOIN medicines m ON cp.medicine_id = m.id
             JOIN consultations c ON cp.consultation_id = c.id
             JOIN users u ON c.doctor_id = u.id
             WHERE c.patient_id = $1 
               AND cp.purchased_quantity < cp.total_quantity 
               AND cp.valid_until > NOW()
             ORDER BY c.created_at DESC`,
            [patient_id]
        );

        res.status(200).json(cartItems.rows);
    } catch (error) {
        console.error('Error fetching cart:', error.message);
        res.status(500).json({ message: 'Server Error fetching pharmacy cart.' });
    }
};

// @desc    Process Checkout (Handles Partial Fills)
// @route   POST /api/pharmacy/checkout
const processCheckout = async (req, res) => {
    try {
        const patient_id = req.user.id;
        // items will be an array of: { prescription_id, buy_quantity }
        const { items, total_paid, delivery_address } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ message: 'No items in cart.' });

        const newOrder = await db.query(
            `INSERT INTO orders (patient_id, total_amount, shipping_address, status) 
             VALUES ($1, $2, $3, 'processing') RETURNING id`,
            [patient_id, total_paid, delivery_address]
        );
        const order_id = newOrder.rows[0].id;

        // Loop through and update purchased quantities securely
        for (const item of items) {
            await db.query(
                `UPDATE consultation_prescriptions 
                 SET purchased_quantity = purchased_quantity + $1,
                     status = CASE WHEN (purchased_quantity + $1) >= total_quantity THEN 'completed' ELSE 'partial' END
                 WHERE id = $2`,
                [item.buy_quantity, item.prescription_id]
            );
            
            // Log the individual items in the order
            await db.query(
                `INSERT INTO order_items (order_id, prescription_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, 0)`, // Assuming 0 for price_at_purchase placeholder for now
                [order_id, item.prescription_id, item.buy_quantity]
            );
        }

        res.status(200).json({ message: 'Payment successful! Medications are being prepared.', order_id });
    } catch (error) {
        console.error('Error during checkout:', error.message);
        res.status(500).json({ message: 'Checkout processing failed.' });
    }
};

module.exports = { getMyCart, processCheckout };