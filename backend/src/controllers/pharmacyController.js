const db = require('../config/db');

const initializePharmacy = async () => {
  try {
    await db.query(`ALTER TABLE consultation_prescriptions ADD COLUMN IF NOT EXISTS total_quantity INT DEFAULT 1, ADD COLUMN IF NOT EXISTS purchased_quantity INT DEFAULT 0, ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;`);
    await db.query(`CREATE TABLE IF NOT EXISTS medicines (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, type VARCHAR(50), price DECIMAL(10,2) DEFAULT 0.00);`);

    const check = await db.query('SELECT count(*) FROM medicines');
    if (parseInt(check.rows[0].count) === 0) {
       await db.query(`INSERT INTO medicines (name, type, price) VALUES 
         ('Amoxicillin 500mg (Antibiotic)', 'Capsule', 12.99),
         ('Lisinopril 10mg (Blood Pressure)', 'Tablet', 8.50),
         ('Paracetamol 500mg (Pain Relief)', 'Tablet', 5.99),
         ('Omeprazole 20mg (Acid Reflux)', 'Capsule', 15.00)`);
    }
  } catch (err) { console.log("DB Check Skipped."); }
};
initializePharmacy();

const getInventory = async (req, res) => {
    try {
        const meds = await db.query('SELECT * FROM medicines ORDER BY name ASC');
        res.status(200).json(meds.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory' });
    }
};

// @desc    Get all active prescriptions (The "Prescription Vault")
const getMyCart = async (req, res) => {
    try {
        const patient_id = req.user.id;

        // 🚨 BUG FIX: Changed c.created_at to c.consultation_date !!!
        const vaultItems = await db.query(
            `SELECT cp.id as prescription_id, cp.instructions, cp.status, 
                    COALESCE(cp.total_quantity, 1) as total_quantity, 
                    COALESCE(cp.purchased_quantity, 0) as purchased_quantity, 
                    cp.valid_until,
                    m.id as medicine_id, m.name as medicine_name, m.price, m.type,
                    c.consultation_date as prescribed_on, u.full_name as doctor_name
             FROM consultation_prescriptions cp
             JOIN medicines m ON cp.medicine_id = m.id
             JOIN consultations c ON cp.consultation_id = c.id
             JOIN users u ON c.doctor_id = u.id
             WHERE c.patient_id = $1 
               AND COALESCE(cp.purchased_quantity, 0) < COALESCE(cp.total_quantity, 1)
             ORDER BY c.consultation_date DESC`,
            [patient_id]
        );

        res.status(200).json(vaultItems.rows);
    } catch (error) {
        console.error('Error fetching vault:', error.message);
        res.status(500).json({ message: 'Server Error fetching pharmacy vault.' });
    }
};

// @desc    Process Checkout for Partial Fills
const processCheckout = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { items, total_paid, delivery_address } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ message: 'No items in cart.' });

        const newOrder = await db.query(
            `INSERT INTO orders (patient_id, total_amount, shipping_address, status) 
             VALUES ($1, $2, $3, 'processing') RETURNING id`,
            [patient_id, total_paid, delivery_address]
        );
        const order_id = newOrder.rows[0].id;

        for (const item of items) {
            await db.query(
                `UPDATE consultation_prescriptions 
                 SET purchased_quantity = COALESCE(purchased_quantity, 0) + $1,
                     status = CASE WHEN (COALESCE(purchased_quantity, 0) + $1) >= COALESCE(total_quantity, 1) THEN 'completed' ELSE 'partial' END
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

module.exports = { getMyCart, processCheckout, getInventory };