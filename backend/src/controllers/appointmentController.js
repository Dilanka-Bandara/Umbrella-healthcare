const db = require('../config/db');

// @desc    Patient requests a new appointment
// @route   POST /api/appointments/book
const bookAppointment = async (req, res) => {
    try {
        const patient_id = req.user.id; 
        const { doctor_id, appointment_date, appointment_time } = req.body;

        if (!doctor_id || !appointment_date || !appointment_time) {
            return res.status(400).json({ message: 'Doctor ID, date, and time are required.' });
        }

        // Verify the target user is actually a doctor
        const doctorCheck = await db.query('SELECT id FROM users WHERE id = $1 AND role = $2', [doctor_id, 'doctor']);
        if (doctorCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Selected doctor not found.' });
        }

        const newAppointment = await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [patient_id, doctor_id, appointment_date, appointment_time]
        );

        res.status(201).json({
            message: 'Appointment requested successfully! Pending doctor approval.',
            appointment: newAppointment.rows[0]
        });
    } catch (error) {
        console.error('Error booking appointment:', error.message);
        res.status(500).json({ message: 'Server Error scheduling appointment.' });
    }
};

// @desc    Get all appointments (Smart route: Shows patients for doctors, or doctors for patients)
// @route   GET /api/appointments
const getMyAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let queryText = '';

        if (role === 'doctor') {
            queryText = `
                SELECT a.*, u.full_name AS patient_name, u.phone_number AS patient_phone
                FROM appointments a JOIN users u ON a.patient_id = u.id
                WHERE a.doctor_id = $1 ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
        } else {
            queryText = `
                SELECT a.*, u.full_name AS doctor_name, u.phone_number AS doctor_phone
                FROM appointments a JOIN users u ON a.doctor_id = u.id
                WHERE a.patient_id = $1 ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
        }

        const appointments = await db.query(queryText, [userId]);
        res.status(200).json(appointments.rows);
    } catch (error) {
        console.error('Error fetching appointments:', error.message);
        res.status(500).json({ message: 'Server Error retrieving schedules.' });
    }
};

// @desc    Doctor approves or declines an appointment
// @route   PUT /api/appointments/status/:id
const updateAppointmentStatus = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const appointment_id = req.params.id;
        const { status } = req.body; 

        if (!['approved', 'declined', 'completed'].includes(status)) {
            return res.status(400).json({ message: "Status must be 'approved', 'declined', or 'completed'." });
        }

        // Verify the appointment belongs to THIS doctor
        const appointment = await db.query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
        if (appointment.rows.length === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        if (appointment.rows[0].doctor_id !== doctor_id) {
            return res.status(403).json({ message: 'Not authorized to manage this appointment.' });
        }

        const updatedAppointment = await db.query(
            `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, appointment_id]
        );

        res.status(200).json({
            message: `Appointment status updated to ${status}!`,
            appointment: updatedAppointment.rows[0]
        });
    } catch (error) {
        console.error('Error updating appointment:', error.message);
        res.status(500).json({ message: 'Server Error updating schedule.' });
    }
};

module.exports = { bookAppointment, getMyAppointments, updateAppointmentStatus };