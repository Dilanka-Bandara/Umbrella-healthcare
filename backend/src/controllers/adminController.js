const db = require('../config/db');

// @desc    Approve a pending doctor account
// @route   PUT /api/admin/approve-doctor/:id
const approveDoctor = async (req, res) => {
    try {
        // Grab the doctor's ID from the URL (e.g., /approve-doctor/12345)
        const doctorId = req.params.id;

        // 1. Check if the user exists and is actually a doctor
        const userResult = await db.query('SELECT * FROM users WHERE id = $1 AND role = $2', [doctorId, 'doctor']);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        const doctor = userResult.rows[0];

        if (doctor.is_verified) {
            return res.status(400).json({ message: 'This doctor is already verified.' });
        }

        // 2. Update the verification status to true
        const updatedDoctor = await db.query(
            `UPDATE users SET is_verified = true, updated_at = NOW() 
             WHERE id = $1 RETURNING id, full_name, email, is_verified`,
            [doctorId]
        );

        // 3. Send success response
        res.status(200).json({
            message: 'Doctor approved successfully! They can now log in.',
            doctor: updatedDoctor.rows[0]
        });

    } catch (error) {
        console.error('Error in approveDoctor:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    approveDoctor
};