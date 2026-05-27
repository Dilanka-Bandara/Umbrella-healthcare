const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (Patient, Doctor, Admin)
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    try {
        // We now accept a medical_license_url from the frontend
        const { role, full_name, email, password, phone_number, medical_license_url } = req.body;

        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // --- NEW LOGIC: VERIFICATION ---
        // Patients and Admins are verified instantly. Doctors must wait for approval.
        let is_verified = true;
        if (role === 'doctor') {
            is_verified = false; 
            
            // If they are a doctor but didn't provide a license, block the registration
            if (!medical_license_url) {
                return res.status(400).json({ message: 'Doctors must provide a medical license document.' });
            }
        }

        const newUser = await db.query(
            `INSERT INTO users (role, full_name, email, password_hash, phone_number, is_verified, medical_license_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, role, full_name, email, is_verified`,
            [role, full_name, email, passwordHash, phone_number, is_verified, medical_license_url]
        );

        res.status(201).json({
            message: role === 'doctor' ? 'Registration successful! Please wait for admin approval.' : 'User registered successfully!',
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error('Error in registerUser:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Authenticate a user & get token
// @route   POST /api/users/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if the user exists in the database
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // 2. Compare the typed password with the scrambled password in the database
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // --- NEW LOGIC: BLOCK UNVERIFIED DOCTORS ---
        if (user.role === 'doctor' && user.is_verified === false) {
            return res.status(403).json({ 
                message: 'Your doctor account is pending admin approval. Please check back later.' 
            });
        }

        // 3. Generate the Digital Badge (JWT)
        // We pack the user's ID and Role inside the token so the frontend knows who they are
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // The token expires in 1 day for security
        );

        // 4. Send the token and user details back to the frontend
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                role: user.role,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error in loginUser:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile picture
// @route   PUT /api/users/profile-picture
const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id; // We know who they are from their token!
        const { profile_picture_url } = req.body; // The Cloudinary link they just uploaded

        if (!profile_picture_url) {
            return res.status(400).json({ message: 'Please provide a valid image URL.' });
        }

        const updatedUser = await db.query(
            `UPDATE users SET profile_picture_url = $1, updated_at = NOW() 
             WHERE id = $2 RETURNING id, full_name, role, profile_picture_url`,
            [profile_picture_url, userId]
        );

        res.status(200).json({
            message: 'Profile picture updated successfully!',
            user: updatedUser.rows[0]
        });

    } catch (error) {
        console.error('Error updating profile picture:', error.message);
        res.status(500).json({ message: 'Server Error updating profile.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfilePicture // NEW
};