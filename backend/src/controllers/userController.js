const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { generateUniqueClinicId } = require('../utils/clinicId');

// @desc    Register a new user (Patient, Doctor, Admin)
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    try {
        const { role, full_name, email, password, phone_number, medical_license_url } = req.body;

        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let is_verified = true;
        let clinic_id = null;

        if (role === 'doctor') {
            is_verified = false;

            if (!medical_license_url) {
                return res.status(400).json({ message: 'Doctors must provide a medical license document.' });
            }

            clinic_id = await generateUniqueClinicId();
        }

        let newUser;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                newUser = await db.query(
                    `INSERT INTO users (role, full_name, email, password_hash, phone_number, is_verified, medical_license_url, clinic_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     RETURNING id, role, full_name, email, is_verified, clinic_id`,
                    [role, full_name, email, passwordHash, phone_number, is_verified, medical_license_url, clinic_id]
                );
                break; 
            } catch (insertErr) {
                if (insertErr.code === '23505' && role === 'doctor') {
                    clinic_id = await generateUniqueClinicId(); 
                    continue;
                }
                throw insertErr; 
            }
        }

        if (!newUser) {
            return res.status(500).json({ message: 'Could not complete registration. Please try again.' });
        }

        res.status(201).json({
            message: role === 'doctor'
                ? 'Registration successful! Please wait for admin approval.'
                : 'User registered successfully!',
            clinic_id: newUser.rows[0].clinic_id,
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

        // 🚨 UPGRADE 1: Clean the email of any accidental spaces and lowercase it
        const cleanEmail = email.trim().toLowerCase();
        
        console.log(`[LOGIN ATTEMPT] Email: ${cleanEmail}`);

        // 1. Check if the user exists in the database
        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
        let user;

        // 🚨 UPGRADE 2: Foolproof Pharmacist Auto-Creation
        // If the pharmacist account doesn't exist yet, build it right now and log them in!
        if (userResult.rows.length === 0 && cleanEmail === 'pharmacist@umbrella.com') {
            console.log("[SYSTEM] Pharmacist account missing! Auto-creating...");
            
            const salt = await bcrypt.genSalt(10);
            const autoHash = await bcrypt.hash('password123', salt);
            
            await db.query(`
                INSERT INTO users (role, full_name, email, password_hash, is_active, is_verified)
                VALUES ('pharmacist', 'Dr. Sarah (Pharmacy Manager)', 'pharmacist@umbrella.com', $1, true, true)
            `, [autoHash]);

            // Re-fetch the newly created user
            userResult = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
            user = userResult.rows[0];
        } 
        else if (userResult.rows.length === 0) {
            // Normal behavior for any other incorrect email
            return res.status(400).json({ message: 'Invalid email or password' });
        } else {
            user = userResult.rows[0];
        }

        // 2. Compare the typed password with the scrambled password in the database
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.log(`[LOGIN FAILED] Password mismatch for: ${cleanEmail}`);
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // --- BLOCK UNVERIFIED DOCTORS ---
        if (user.role === 'doctor' && user.is_verified === false) {
            return res.status(403).json({
                message: 'Your doctor account is pending admin approval. Please check back later.'
            });
        }

        // 3. Generate the Digital Badge (JWT)
        // 🚨 UPGRADE 3: Added a fallback secret just in case your .env file isn't loading properly
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'umbrella_fallback_secret_key_123',
            { expiresIn: '1d' } 
        );

        console.log(`[LOGIN SUCCESS] Authenticated ${user.role}: ${cleanEmail}`);

        // 4. Send the token and user details back to the frontend
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                role: user.role,
                full_name: user.full_name,
                email: user.email,
                clinic_id: user.clinic_id 
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
        const userId = req.user.id; 
        const { profile_picture_url } = req.body; 

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
    updateProfilePicture
};