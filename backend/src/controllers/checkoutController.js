const db = require('../config/db');
const crypto = require('crypto'); // Built-in Node tool to generate UUIDs

// @desc    Process a MULTI-ITEM shopping cart purchase
// @route   POST /api/checkout
const processCheckout = async (req, res) => {
    const client = await db.connect(); 

    try {
        await client.query('BEGIN'); // Lock database!

        const patient_id = req.user.id;
        const { cart, shipping_address } = req.body; 
        // Note: 'cart' is now an array: [{medicine_id: "123", quantity: 2}, {medicine_id: "456", quantity: 1}]

        if (!shipping_address) {
            throw new Error('Shipping address is required.');
        }
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            throw new Error('Your shopping cart is empty.');
        }

        const cart_id = crypto.randomUUID(); // Generate one master ID for this whole box
        let total_cost = 0;
        const receipts = [];

        // ==========================================
        // PHASE 1: VERIFICATION (Check Everything!)
        // ==========================================
        for (const item of cart) {
            const { medicine_id, quantity } = item;

            if (quantity <= 0) throw new Error('Quantity must be greater than 0.');

            // A. Does it exist?
            const medCheck = await client.query('SELECT * FROM medicines WHERE id = $1', [medicine_id]);
            if (medCheck.rows.length === 0) throw new Error(`Medicine ID ${medicine_id} not found.`);
            const medicine = medCheck.rows[0];

            // B. Is there enough stock?
            if (medicine.stock_quantity < quantity) {
                throw new Error(`Only ${medicine.stock_quantity} units of ${medicine.name} left in stock.`);
            }

            // C. Does it require a prescription?
            if (medicine.requires_prescription) {
                const rxCheck = await client.query(
                    `SELECT id FROM consultation_prescriptions 
                     WHERE consultation_id IN (SELECT id FROM consultations WHERE patient_id = $1)
                     AND medicine_id = $2 AND valid_until > NOW()
                     
                     UNION 
                     
                     SELECT id FROM manual_prescription_approvals 
                     WHERE patient_id = $1 AND medicine_id = $2 AND status = 'approved' AND valid_until > NOW()`,
                    [patient_id, medicine_id]
                );

                if (rxCheck.rows.length === 0) {
                    throw new Error(`Legal Restriction: You need a valid prescription to buy ${medicine.name}.`);
                }
            }

            // D. Add to the running math total
            total_cost += (medicine.price * quantity);
        }

        // ==========================================
        // PHASE 2: EXECUTION (Process the Order!)
        // ==========================================
        for (const item of cart) {
            const { medicine_id, quantity } = item;

            // Deduct stock
            await client.query(
                'UPDATE medicines SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [quantity, medicine_id]
            );

            // Save line item to receipt
            const newPurchase = await client.query(
                `INSERT INTO patient_purchases (patient_id, medicine_id, quantity, shipping_address, status, cart_id) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [patient_id, medicine_id, quantity, shipping_address, 'Processing', cart_id]
            );
            receipts.push(newPurchase.rows[0]);
        }

        await client.query('COMMIT'); // SUCCESS! Save everything.

        res.status(200).json({
            message: 'Multi-item checkout successful! Order is processing.',
            cart_id: cart_id,
            total_paid: `$${total_cost.toFixed(2)}`,
            items: receipts
        });

    } catch (error) {
        await client.query('ROLLBACK'); // If ANY item failed the checks, undo the entire cart!
        console.error('Checkout Error:', error.message);
        res.status(400).json({ message: error.message });
    } finally {
        client.release();
    }
};

module.exports = { processCheckout };