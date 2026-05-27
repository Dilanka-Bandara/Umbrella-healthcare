const db = require('../config/db');

// @desc    Add a new medicine to the inventory (Admin Only)
// @route   POST /api/pharmacy/medicines
const addMedicine = async (req, res) => {
    try {
        const { name, dosage, type, price, stock_quantity } = req.body;
        
        // Defensive check: Make sure they didn't leave important fields blank
        if (!name || !dosage || !price) {
            return res.status(400).json({ message: 'Name, dosage, and price are required.' });
        }

        const newMedicine = await db.query(
            `INSERT INTO medicines (name, dosage, type, price, stock_quantity)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, dosage, type, price, stock_quantity || 0]
        );

        res.status(201).json({
            message: 'Medicine added to digital shelf successfully!',
            medicine: newMedicine.rows[0]
        });

    } catch (error) {
        console.error('Error adding medicine:', error.message);
        res.status(500).json({ message: 'Server Error adding medicine to inventory.' });
    }
};

// @desc    Get the full list of medicines (For doctors prescribing or patients shopping)
// @route   GET /api/pharmacy/medicines
const getAllMedicines = async (req, res) => {
    try {
        // We order it alphabetically so it's easy for the frontend to display
        const medicines = await db.query('SELECT * FROM medicines ORDER BY name ASC');
        res.status(200).json(medicines.rows);
    } catch (error) {
        console.error('Error fetching medicines:', error.message);
        res.status(500).json({ message: 'Server Error fetching inventory.' });
    }
};

module.exports = { addMedicine, getAllMedicines };