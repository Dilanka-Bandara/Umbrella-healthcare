const express = require('express');
const router = express.Router();
const { bookAppointment, getMyAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

// Route 1: Book an appointment (Logged in users)
router.post('/book', protect, bookAppointment);

// Route 2: View schedule (Logged in users)
router.get('/', protect, getMyAppointments);

// Route 3: Approve/Decline (Strictly DOCTORS only)
router.put('/status/:id', protect, authorizeRole('doctor'), updateAppointmentStatus);

module.exports = router;