const bcrypt = require('bcrypt');
const db = require('../config/db');

// @desc    Register a new user (Patient, Doctor, Admin)
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    try {
        const { role, full_name, email, password, phone_number } = req.body;

        // 1. Check if the user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 2. Scramble (Hash) the password for security
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Save the new user to the database using the schema we built
        const newUser = await db.query(
            `INSERT INTO users (role, full_name, email, password_hash, phone_number) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, role, full_name, email`,
            [role, full_name, email, passwordHash, phone_number]
        );

        // 4. Send success response back to frontend
        res.status(201).json({
            message: 'User registered successfully!',
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error('Error in registerUser:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    registerUser
};