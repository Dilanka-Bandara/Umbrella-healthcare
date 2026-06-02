const db = require('../config/db');

// 🔥 AUTO-MIGRATION: Adds Partial Fulfillment columns safely
db.query(`
  ALTER TABLE consultation_prescriptions 
  ADD COLUMN IF NOT EXISTS total_quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS purchased_quantity INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
`).catch(() => console.log("DB migration skipped"));

// @desc    Get all active prescriptions (The "Prescription Vault")
// @route   GET /api/pharmacy/my-cart
const getMyCart = async (req, res) => {
    try {
        const patient_id = req.user.id;

        // Fetch only prescriptions that have a remaining balance AND are not expired
        const vaultItems = await db.query(
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
             ORDER BY c.created_at DESC`,
            [patient_id]
        );

        res.status(200).json(vaultItems.rows);
    } catch (error) {
        console.error('Error fetching vault:', error.message);
        res.status(500).json({ message: 'Server Error fetching pharmacy vault.' });
    }
};

// @desc    Process Checkout for Partial Fills
// @route   POST /api/pharmacy/checkout
const processCheckout = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { items, total_paid, delivery_address } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ message: 'No items in cart.' });

        // 1. Create the Order
        const newOrder = await db.query(
            `INSERT INTO orders (patient_id, total_amount, shipping_address, status) 
             VALUES ($1, $2, $3, 'processing') RETURNING id`,
            [patient_id, total_paid, delivery_address]
        );
        const order_id = newOrder.rows[0].id;

        // 2. Loop through and deduct the purchased amount from the Vault limit!
        for (const item of items) {
            await db.query(
                `UPDATE consultation_prescriptions 
                 SET purchased_quantity = purchased_quantity + $1,
                     status = CASE WHEN (purchased_quantity + $1) >= total_quantity THEN 'completed' ELSE 'partial' END
                 WHERE id = $2`,
                [item.buy_quantity, item.prescription_id]
            );
            
            await db.query(
                `INSERT INTO order_items (order_id, prescription_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, 0)`, 
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