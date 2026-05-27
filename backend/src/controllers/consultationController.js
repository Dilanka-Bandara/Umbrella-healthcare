const db = require('../config/db');

// @desc    Connect a Doctor to a Patient using the Patient's ID
// @route   POST /api/consultations/connect
const connectPatient = async (req, res) => {
    try {
        const doctor_id = req.user.id; // We get this securely from the Doctor's login token
        const { patient_id } = req.body; // The doctor types this into the frontend

        // 1. Verify the patient exists
        const patientExists = await db.query('SELECT id, full_name FROM users WHERE id = $1 AND role = $2', [patient_id, 'patient']);
        if (patientExists.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found. Please check the ID.' });
        }

        // 2. Check if they are already connected
        const linkExists = await db.query(
            'SELECT * FROM doctor_patient_links WHERE doctor_id = $1 AND patient_id = $2',
            [doctor_id, patient_id]
        );
        if (linkExists.rows.length > 0) {
            return res.status(400).json({ message: 'You are already connected to this patient.' });
        }

        // 3. Create the connection
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

// @desc    Save a new Consultation record with attachments (smart pen, X-rays)
// @route   POST /api/consultations/record
const saveConsultation = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { patient_id, symptoms_notes, diagnosis, file_urls } = req.body; 
        // file_urls will be an array of Cloudinary links we got from your previous upload step!

        // 1. Save the main text record
        const newConsultation = await db.query(
            `INSERT INTO consultations (doctor_id, patient_id, symptoms_notes, diagnosis) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [doctor_id, patient_id, symptoms_notes, diagnosis]
        );

        const consultation_id = newConsultation.rows[0].id;

        // 2. If the doctor drew with the smart pen or uploaded X-rays, save those links!
        if (file_urls && file_urls.length > 0) {
            for (const url of file_urls) {
                await db.query(
                    `INSERT INTO consultation_attachments (consultation_id, file_url, file_type) 
                     VALUES ($1, $2, $3)`,
                    [consultation_id, url, 'medical_document']
                );
            }
        }

        res.status(201).json({ message: 'Consultation saved successfully to the database!' });

    } catch (error) {
        console.error('Error saving consultation:', error.message);
        res.status(500).json({ message: 'Server Error saving medical record.' });
    }
};

// @desc    Update an existing medical record (Only the original doctor can do this)
// @route   PUT /api/consultations/record/:id
const updateConsultation = async (req, res) => {
    try {
        const doctor_id = req.user.id; // From the logged-in doctor's token
        const consultation_id = req.params.id; // From the URL
        const { symptoms_notes, diagnosis } = req.body;

        // 1. Find the consultation in the database
        const checkRecord = await db.query('SELECT * FROM consultations WHERE id = $1', [consultation_id]);

        if (checkRecord.rows.length === 0) {
            return res.status(404).json({ message: 'Medical record not found.' });
        }

        // 2. STRICT SECURITY CHECK: Did THIS doctor write THIS record?
        if (checkRecord.rows[0].doctor_id !== doctor_id) {
            return res.status(403).json({ 
                message: 'Legal Restriction: You are only authorized to edit your own medical records.' 
            });
        }

        // 3. Update the record and the new updated_at timestamp
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

module.exports = { connectPatient, saveConsultation, updateConsultation };