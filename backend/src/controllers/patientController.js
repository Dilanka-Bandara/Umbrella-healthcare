const db = require('../config/db');

const connectDoctor = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctor_clinic_id } = req.body;

    if (!doctor_clinic_id) return res.status(400).json({ message: 'Doctor Clinic ID is required.' });

    const doctorQuery = await db.query('SELECT id, role FROM users WHERE clinic_id = $1 AND role = $2', [doctor_clinic_id, 'doctor']);
    if (doctorQuery.rows.length === 0) return res.status(404).json({ message: 'Invalid ID. No doctor found.' });

    const doctorId = doctorQuery.rows[0].id;
    const existingConnection = await db.query('SELECT id FROM patient_doctor_connections WHERE patient_id = $1 AND doctor_id = $2', [patientId, doctorId]);
    
    if (existingConnection.rows.length > 0) return res.status(400).json({ message: 'You are already connected to this doctor.' });

    await db.query('INSERT INTO patient_doctor_connections (patient_id, doctor_id, status) VALUES ($1, $2, $3)', [patientId, doctorId, 'active']);
    res.status(200).json({ message: 'Successfully connected to the doctor!', doctor_id: doctorId });

  } catch (error) {
    console.error('Error connecting to doctor:', error);
    res.status(500).json({ message: 'Server error while connecting.' });
  }
};

// 🚨 UPGRADED: Fetch ALL doctors this patient is connected to (Their "Care Team")
const getMyDoctors = async (req, res) => {
  try {
    const patientId = req.user.id;
    const query = await db.query(
      `SELECT u.id, u.full_name, u.clinic_id, pdc.created_at 
       FROM users u
       JOIN patient_doctor_connections pdc ON u.id = pdc.doctor_id
       WHERE pdc.patient_id = $1 AND pdc.status = 'active'
       ORDER BY pdc.created_at DESC`,
      [patientId]
    );

    res.status(200).json(query.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error fetching care team.' });
  }
};

module.exports = { connectDoctor, getMyDoctors };