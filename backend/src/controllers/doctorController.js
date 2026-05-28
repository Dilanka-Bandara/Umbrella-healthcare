const db = require('../config/db');

// @desc    Get a list of all patients connected to this doctor
// @route   GET /api/doctors/my-patients
const getMyPatients = async (req, res) => {
    try {
        const doctorId = req.user.id;

        // Fetch patients connected to this specific doctor
        const patientsQuery = await db.query(
            `SELECT u.id, u.full_name, u.email, u.phone_number, u.profile_picture_url, pdc.created_at AS connected_on
             FROM users u
             JOIN patient_doctor_connections pdc ON u.id = pdc.patient_id
             WHERE pdc.doctor_id = $1 AND pdc.status = 'active'
             ORDER BY pdc.created_at DESC`,
            [doctorId]
        );

        res.status(200).json(patientsQuery.rows);

    } catch (error) {
        console.error('Error fetching patients:', error.message);
        res.status(500).json({ message: 'Server Error fetching patient list.' });
    }
};

module.exports = { getMyPatients };