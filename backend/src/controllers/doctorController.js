const db = require('../config/db');

// @desc    Get ONLY Active Live Sessions (Waiting Room)
// @route   GET /api/doctors/my-patients
const getActivePatients = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const query = await db.query(
            `SELECT u.id, u.full_name, pdc.created_at as connected_on 
             FROM users u
             JOIN patient_doctor_connections pdc ON u.id = pdc.patient_id
             WHERE pdc.doctor_id = $1 AND pdc.status = 'active'`,
            [doctor_id]
        );
        res.status(200).json(query.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching active patients.' });
    }
};

// @desc    Get ALL historical patients (The Vault)
// @route   GET /api/doctors/all-patients
const getAllPatients = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        // Fetch distinct patients who have either an active or completed connection
        const query = await db.query(
            `SELECT DISTINCT u.id, u.full_name, u.email, u.phone_number
             FROM users u
             JOIN patient_doctor_connections pdc ON u.id = pdc.patient_id
             WHERE pdc.doctor_id = $1`,
            [doctor_id]
        );
        res.status(200).json(query.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching patient database.' });
    }
};

// @desc    Save an uploaded document link to the Patient's Vault
// @route   POST /api/doctors/patient/:patientId/document
const savePatientDocument = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { patientId } = req.params;
        const { file_url, file_name } = req.body;

        const newDoc = await db.query(
            `INSERT INTO patient_documents (doctor_id, patient_id, file_url, file_name) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [doctor_id, patientId, file_url, file_name]
        );

        res.status(201).json({ message: 'Document saved to vault.', document: newDoc.rows[0] });
    } catch (error) {
        console.error("Document Save Error:", error);
        res.status(500).json({ message: 'Server Error saving document.' });
    }
};

// @desc    Get all documents for a specific patient
// @route   GET /api/doctors/patient/:patientId/documents
const getPatientDocuments = async (req, res) => {
    try {
        const { patientId } = req.params;
        const query = await db.query(
            `SELECT * FROM patient_documents WHERE patient_id = $1 ORDER BY uploaded_at DESC`,
            [patientId]
        );
        res.status(200).json(query.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching documents.' });
    }
};

module.exports = { getActivePatients, getAllPatients, savePatientDocument, getPatientDocuments };