const db = require('../config/db');

// @desc    Connect a patient to a doctor (Handles Re-connections!)
// @route   POST /api/patients/connect-doctor
const connectDoctor = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctor_clinic_id } = req.body;

    if (!doctor_clinic_id) return res.status(400).json({ message: 'Doctor Clinic ID is required.' });

    // 1. Find the Doctor by Clinic ID
    const doctorQuery = await db.query('SELECT id, role FROM users WHERE clinic_id = $1 AND role = $2', [doctor_clinic_id, 'doctor']);
    if (doctorQuery.rows.length === 0) return res.status(404).json({ message: 'Invalid ID. No doctor found.' });

    const doctorId = doctorQuery.rows[0].id;

    // 2. Check if a connection already exists between this patient and doctor
    const existingConnection = await db.query(
      'SELECT id, status FROM patient_doctor_connections WHERE patient_id = $1 AND doctor_id = $2', 
      [patientId, doctorId]
    );
    
    if (existingConnection.rows.length > 0) {
      const connStatus = existingConnection.rows[0].status;
      
      // If they are already in the waiting room, block duplicate
      if (connStatus === 'active') {
        return res.status(400).json({ message: 'You are already in the waiting room for this doctor.' });
      } else {
        // 🚨 THE FIX: If the previous session was 'completed', RE-CONNECT THEM!
        // We update the status back to 'active' and reset the timestamp so they appear at the top of the Doctor's queue.
        await db.query(
          `UPDATE patient_doctor_connections 
           SET status = 'active', created_at = CURRENT_TIMESTAMP 
           WHERE patient_id = $1 AND doctor_id = $2`,
          [patientId, doctorId]
        );
        return res.status(200).json({ message: 'Successfully re-connected! You are in the waiting room.', doctor_id: doctorId });
      }
    }

    // 3. If they have NEVER connected before, insert a brand new connection
    await db.query(
      'INSERT INTO patient_doctor_connections (patient_id, doctor_id, status) VALUES ($1, $2, $3)', 
      [patientId, doctorId, 'active']
    );
    res.status(200).json({ message: 'Successfully connected to the doctor!', doctor_id: doctorId });

  } catch (error) {
    console.error('Error connecting to doctor:', error);
    res.status(500).json({ message: 'Server error while connecting.' });
  }
};

// @desc    Fetch ALL doctors this patient is connected to (Their "Care Team")
// @route   GET /api/patients/my-doctors
const getMyDoctors = async (req, res) => {
  try {
    const patientId = req.user.id;
    const query = await db.query(
      `SELECT DISTINCT u.id, u.full_name, u.clinic_id, pdc.created_at 
       FROM users u
       JOIN patient_doctor_connections pdc ON u.id = pdc.doctor_id
       WHERE pdc.patient_id = $1
       ORDER BY pdc.created_at DESC`,
      [patientId]
    );
    res.status(200).json(query.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error fetching care team.' });
  }
};

// @desc    Fetch the Patient's Medical History & Prescriptions
// @route   GET /api/patients/my-history
// @desc    Fetch the Patient's Medical History, Prescriptions, & Uploaded Documents
// @route   GET /api/patients/my-history
const getMyHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    
    // 1. Get all consultations for this patient
    const historyQuery = await db.query(
      `SELECT c.id, c.created_at, c.diagnosis, c.symptoms_notes, u.full_name as doctor_name
       FROM consultations c
       JOIN users u ON c.doctor_id = u.id
       WHERE c.patient_id = $1
       ORDER BY c.created_at DESC`,
      [patientId]
    );

    const consultations = historyQuery.rows;

    // 2. Loop through and attach medicines AND uploaded documents!
    for (let consult of consultations) {
      // Attach Medicines
      const rxQuery = await db.query(
        `SELECT cp.instructions, cp.status, m.name as medicine_name
         FROM consultation_prescriptions cp
         JOIN medicines m ON cp.medicine_id = m.id
         WHERE cp.consultation_id = $1`,
        [consult.id]
      );
      consult.prescriptions = rxQuery.rows;

      // 🚨 NEW: Attach Uploaded Documents
      const attachQuery = await db.query(
        `SELECT file_url, file_type 
         FROM consultation_attachments 
         WHERE consultation_id = $1`,
        [consult.id]
      );
      consult.attachments = attachQuery.rows;
    }

    res.status(200).json(consultations);
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({ message: 'Server error fetching medical history.' });
  }
};

module.exports = { connectDoctor, getMyDoctors, getMyHistory };

