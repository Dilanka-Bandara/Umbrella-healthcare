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

// @desc    Get the list of medicines with Pagination and Search
// @route   GET /api/pharmacy/medicines?page=1&limit=20&search=para
const getAllMedicines = async (req, res) => {
    try {
        // 1. Get the query parameters from the URL (or set safe defaults)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // 20 items per page
        const search = req.query.search || ''; // Default to empty string if no search

        // 2. Calculate the "Offset" (e.g., if on Page 2, skip the first 20 items)
        const offset = (page - 1) * limit;

        // 3. Search the database using ILIKE (case-insensitive search) and Pagination
        const queryText = `
            SELECT * FROM medicines 
            WHERE name ILIKE $1 
            ORDER BY name ASC 
            LIMIT $2 OFFSET $3
        `;
        // The % signs mean "find this text anywhere inside the name"
        const values = [`%${search}%`, limit, offset];

        const medicines = await db.query(queryText, values);

        // 4. Get the total count of matching items so the frontend can build page numbers (1, 2, 3...)
        const countQuery = await db.query('SELECT COUNT(*) FROM medicines WHERE name ILIKE $1', [`%${search}%`]);
        const totalItems = parseInt(countQuery.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // 5. Send back the structured data
        res.status(200).json({
            current_page: page,
            total_pages: totalPages,
            total_items: totalItems,
            items_on_this_page: medicines.rows.length,
            medicines: medicines.rows
        });

    } catch (error) {
        console.error('Error fetching medicines:', error.message);
        res.status(500).json({ message: 'Server Error fetching inventory.' });
    }
};

module.exports = { addMedicine, getAllMedicines };