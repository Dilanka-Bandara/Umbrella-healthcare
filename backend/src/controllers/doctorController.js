const db = require('../config/db');

// @desc    Get a list of all ACTIVE patients currently connected
// @route   GET /api/doctors/my-patients
const getMyPatients = async (req, res) => {
    try {
        const doctorId = req.user.id;
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
        console.error('Error fetching active patients:', error.message);
        res.status(500).json({ message: 'Server Error fetching patient list.' });
    }
};

// @desc    Get a permanent directory of all past patients
// @route   GET /api/doctors/directory
const getPatientDirectory = async (req, res) => {
    try {
        const doctorId = req.user.id;
        // Fetch unique patients that have at least one completed consultation with this doctor
        const directoryQuery = await db.query(
            `SELECT DISTINCT u.id, u.full_name, u.email, u.phone_number 
             FROM users u
             JOIN consultations c ON u.id = c.patient_id
             WHERE c.doctor_id = $1`,
            [doctorId]
        );
        res.status(200).json(directoryQuery.rows);
    } catch (error) {
        console.error('Error fetching patient directory:', error.message);
        res.status(500).json({ message: 'Server Error fetching patient directory.' });
    }
};

module.exports = { getMyPatients, getPatientDirectory };