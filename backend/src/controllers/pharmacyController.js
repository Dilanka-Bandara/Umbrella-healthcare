const db = require('../config/db');

// @desc    Get all pending prescriptions for a patient's cart
// @route   GET /api/pharmacy/my-cart
const getMyCart = async (req, res) => {
    try {
        const patient_id = req.user.id;

        // Fetch prescriptions linked to this patient that haven't been ordered yet
        const cartItems = await db.query(
            `SELECT cp.id as prescription_id, cp.instructions, cp.status, 
                    m.id as medicine_id, m.name as medicine_name, m.price, m.type,
                    c.created_at as prescribed_on, u.full_name as doctor_name
             FROM consultation_prescriptions cp
             JOIN medicines m ON cp.medicine_id = m.id
             JOIN consultations c ON cp.consultation_id = c.id
             JOIN users u ON c.doctor_id = u.id
             WHERE c.patient_id = $1 AND cp.status = 'pending'
             ORDER BY c.created_at DESC`,
            [patient_id]
        );

        res.status(200).json(cartItems.rows);
    } catch (error) {
        console.error('Error fetching cart:', error.message);
        res.status(500).json({ message: 'Server Error fetching pharmacy cart.' });
    }
};

// @desc    Process Checkout and mark prescriptions as ordered
// @route   POST /api/pharmacy/checkout
const processCheckout = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { prescription_ids, total_paid, delivery_address } = req.body;

        if (!prescription_ids || prescription_ids.length === 0) {
            return res.status(400).json({ message: 'No items in cart.' });
        }

        // 1. Create the main Order record
        const newOrder = await db.query(
            `INSERT INTO orders (patient_id, total_amount, delivery_address, status) 
             VALUES ($1, $2, $3, 'Processing') RETURNING id`,
            [patient_id, total_paid, delivery_address]
        );
        const order_id = newOrder.rows[0].id;

        // 2. Loop through and update prescriptions to 'ordered' and link to order
        for (const pid of prescription_ids) {
            await db.query(
                `UPDATE consultation_prescriptions 
                 SET status = 'ordered' 
                 WHERE id = $1`,
                [pid]
            );
            
            // Note: In a full DB, you'd insert into an `order_items` table here too
        }

        res.status(200).json({ 
            message: 'Payment successful! Medications are being prepared.',
            order_id: order_id
        });

    } catch (error) {
        console.error('Error during checkout:', error.message);
        res.status(500).json({ message: 'Checkout processing failed.' });
    }
};

module.exports = { getMyCart, processCheckout };