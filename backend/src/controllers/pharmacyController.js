const db = require('../config/db');

// 🔥 AUTO-MIGRATION & DB SEEDING: Ensures medicines exist in the database!
const initializePharmacy = async () => {
  try {
    // 1. Ensure columns exist
    await db.query(`ALTER TABLE consultation_prescriptions ADD COLUMN IF NOT EXISTS total_quantity INT DEFAULT 1, ADD COLUMN IF NOT EXISTS purchased_quantity INT DEFAULT 0, ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;`);
    
    // 2. Ensure medicines table exists
    await db.query(`CREATE TABLE IF NOT EXISTS medicines (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, type VARCHAR(50), price DECIMAL(10,2) DEFAULT 0.00);`);
    
    // 3. Seed medicines if empty
    const check = await db.query('SELECT count(*) FROM medicines');
    if (parseInt(check.rows[0].count) === 0) {
       await db.query(`INSERT INTO medicines (name, type, price) VALUES 
         ('Amoxicillin 500mg (Antibiotic)', 'Capsule', 12.99),
         ('Lisinopril 10mg (Blood Pressure)', 'Tablet', 8.50),
         ('Paracetamol 500mg (Pain Relief)', 'Tablet', 5.99),
         ('Omeprazole 20mg (Acid Reflux)', 'Capsule', 15.00)`);
       console.log("✅ Seeded medicines table with default inventory.");
    }
  } catch (err) { console.log("DB Check Skipped."); }
};
initializePharmacy();

// @desc    Get all medicines for Doctor eRx
// @route   GET /api/pharmacy/inventory
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
        const vaultItems = await db.query(
            `SELECT cp.id as prescription_id, cp.instructions, cp.status, cp.total_quantity, cp.purchased_quantity, cp.valid_until,
                    m.id as medicine_id, m.name as medicine_name, m.price, m.type, c.created_at as prescribed_on, u.full_name as doctor_name
             FROM consultation_prescriptions cp JOIN medicines m ON cp.medicine_id = m.id JOIN consultations c ON cp.consultation_id = c.id JOIN users u ON c.doctor_id = u.id
             WHERE c.patient_id = $1 AND cp.purchased_quantity < cp.total_quantity ORDER BY c.created_at DESC`,
            [patient_id]
        );
        res.status(200).json(vaultItems.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching pharmacy vault.' });
    }
};

// @desc    Process Checkout for Partial Fills
const processCheckout = async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { items, total_paid, delivery_address } = req.body;

        if (!items || items.length === 0) return res.status(400).json({ message: 'No items in cart.' });

        const newOrder = await db.query(`INSERT INTO orders (patient_id, total_amount, shipping_address, status) VALUES ($1, $2, $3, 'processing') RETURNING id`, [patient_id, total_paid, delivery_address]);
        const order_id = newOrder.rows[0].id;

        for (const item of items) {
            await db.query(`UPDATE consultation_prescriptions SET purchased_quantity = purchased_quantity + $1, status = CASE WHEN (purchased_quantity + $1) >= total_quantity THEN 'completed' ELSE 'partial' END WHERE id = $2`, [item.buy_quantity, item.prescription_id]);
            await db.query(`INSERT INTO order_items (order_id, prescription_id, quantity, price_at_purchase) VALUES ($1, $2, $3, 0)`, [order_id, item.prescription_id, item.buy_quantity]);
        }
        res.status(200).json({ message: 'Payment successful!', order_id });
    } catch (error) {
        res.status(500).json({ message: 'Checkout processing failed.' });
    }
};

module.exports = { getMyCart, processCheckout, getInventory };