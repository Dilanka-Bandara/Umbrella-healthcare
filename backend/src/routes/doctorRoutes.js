const express = require('express');
const router = express.Router();
const { getActivePatients, getAllPatients, savePatientDocument, getPatientDocuments } = require('../controllers/doctorController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/my-patients', protect, authorizeRole('doctor'), getActivePatients);
router.get('/all-patients', protect, authorizeRole('doctor'), getAllPatients);
router.post('/patient/:patientId/document', protect, authorizeRole('doctor'), savePatientDocument);
router.get('/patient/:patientId/documents', protect, authorizeRole('doctor'), getPatientDocuments);

module.exports = router;