const db = require('../config/db');

// @desc    Connect a Doctor to a Patient using the Patient's ID
// @route   POST /api/consultations/connect
const connectPatient = async (req, res) => {
    try {
        const doctor_id = req.user.id; 
        const { patient_id } = req.body; 

        const patientExists = await db.query('SELECT id, full_name FROM users WHERE id = $1 AND role = $2', [patient_id, 'patient']);
        if (patientExists.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found. Please check the ID.' });
        }

        const linkExists = await db.query(
            'SELECT * FROM doctor_patient_links WHERE doctor_id = $1 AND patient_id = $2',
            [doctor_id, patient_id]
        );
        if (linkExists.rows.length > 0) {
            return res.status(400).json({ message: 'You are already connected to this patient.' });
        }

        await db.query(
            'INSERT INTO doctor_patient_links (doctor_id, patient_id) VALUES ($1, $2)',
            [doctor_id, patient_id]
        );

        res.status(201).json({ 
            message: `Successfully connected to patient: ${patientExists.rows[0].full_name}!` 
        });

    } catch (error) {
        console.error('Error connecting patient:', error.message);
        res.status(500).json({ message: 'Server Error during connection.' });
    }
};

// @desc    Save a new Consultation record with attachments
// @route   POST /api/consultations/record
const saveConsultation = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { patient_id, symptoms_notes, diagnosis, file_urls } = req.body; 

        // 1. Save the main text record
        const newConsultation = await db.query(
            `INSERT INTO consultations (doctor_id, patient_id, symptoms_notes, diagnosis) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [doctor_id, patient_id, symptoms_notes, diagnosis]
        );
        const consultation_id = newConsultation.rows[0].id;

        // 2. Save attachments if they exist
        if (file_urls && file_urls.length > 0) {
            for (const url of file_urls) {
                await db.query(
                    `INSERT INTO consultation_attachments (consultation_id, file_url, file_type) 
                     VALUES ($1, $2, $3)`,
                    [consultation_id, url, 'medical_document']
                );
            }
        }

        // Return the exact consultation_id so React can attach prescriptions to it
        res.status(201).json({ 
            message: 'Consultation saved successfully to the database!',
            consultation_id: consultation_id
        });
    } catch (error) {
        console.error('Error saving consultation:', error.message);
        res.status(500).json({ message: 'Server Error saving medical record.' });
    }
};

// @desc    Update an existing medical record
// @route   PUT /api/consultations/record/:id
const updateConsultation = async (req, res) => {
    try {
        const doctor_id = req.user.id; 
        const consultation_id = req.params.id; 
        const { symptoms_notes, diagnosis } = req.body;

        const checkRecord = await db.query('SELECT * FROM consultations WHERE id = $1', [consultation_id]);

        if (checkRecord.rows.length === 0) {
            return res.status(404).json({ message: 'Medical record not found.' });
        }

        if (checkRecord.rows[0].doctor_id !== doctor_id) {
            return res.status(403).json({ 
                message: 'Legal Restriction: You are only authorized to edit your own medical records.' 
            });
        }

        const updatedRecord = await db.query(
            `UPDATE consultations 
             SET symptoms_notes = $1, diagnosis = $2, updated_at = NOW() 
             WHERE id = $3 RETURNING id, symptoms_notes, diagnosis, updated_at`,
            [symptoms_notes, diagnosis, consultation_id]
        );

        res.status(200).json({ 
            message: 'Medical record and prescription updated successfully!',
            record: updatedRecord.rows[0]
        });

    } catch (error) {
        console.error('Error updating consultation:', error.message);
        res.status(500).json({ message: 'Server Error updating medical record.' });
    }
};

// @desc    Prescribe a specific medicine from the pharmacy to a consultation
// @route   POST /api/consultations/record/:id/prescribe
const prescribeMedicine = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const consultation_id = req.params.id; 
        const { medicine_id, instructions } = req.body;

        if (!medicine_id || !instructions) {
            return res.status(400).json({ message: 'Medicine ID and instructions are required.' });
        }

        const checkRecord = await db.query('SELECT * FROM consultations WHERE id = $1', [consultation_id]);
        if (checkRecord.rows.length === 0) {
            return res.status(404).json({ message: 'Consultation record not found.' });
        }
        if (checkRecord.rows[0].doctor_id !== doctor_id) {
            return res.status(403).json({ message: 'You can only prescribe medicine for your own patients.' });
        }

        const checkMedicine = await db.query('SELECT name FROM medicines WHERE id = $1', [medicine_id]);
        if (checkMedicine.rows.length === 0) {
            return res.status(404).json({ message: 'Medicine not found in pharmacy inventory.' });
        }

        const newPrescription = await db.query(
            `INSERT INTO consultation_prescriptions (consultation_id, medicine_id, instructions) 
             VALUES ($1, $2, $3) RETURNING *`,
            [consultation_id, medicine_id, instructions]
        );

        res.status(201).json({
            message: `Successfully prescribed ${checkMedicine.rows[0].name} to the patient!`,
            prescription: newPrescription.rows[0]
        });

    } catch (error) {
        console.error('Error prescribing medicine:', error.message);
        res.status(500).json({ message: 'Server Error saving prescription.' });
    }
};

// @desc    Fetch Patient History
// @route   GET /api/consultations/history/:patientId
const getPatientHistory = async (req, res) => {
    try {
        const patient_id = req.params.patientId;
        const history = await db.query(
            `SELECT c.*, u.full_name as doctor_name 
             FROM consultations c 
             JOIN users u ON c.doctor_id = u.id 
             WHERE c.patient_id = $1 ORDER BY c.created_at DESC`,
            [patient_id]
        );
        res.status(200).json(history.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching history.' });
    }
};

module.exports = { connectPatient, saveConsultation, updateConsultation, prescribeMedicine, getPatientHistory };