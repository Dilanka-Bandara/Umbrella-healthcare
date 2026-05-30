const db = require('../config/db');

// @desc    Get all doctors waiting for approval
// @route   GET /api/admin/pending-doctors
const getPendingDoctors = async (req, res) => {
  try {
    const query = await db.query(
      `SELECT id, full_name, email, phone_number, created_at 
       FROM users 
       WHERE role = 'doctor' AND is_verified = false 
       ORDER BY created_at ASC`
    );
    res.status(200).json(query.rows);
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a doctor and generate their Clinic ID
// @route   PUT /api/admin/approve-doctor/:id
const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate a unique 4-digit Clinic ID (e.g., DOC-4928)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const clinicId = `DOC-${randomNum}`;

    const updateQuery = await db.query(
      `UPDATE users 
       SET is_verified = true, clinic_id = $1 
       WHERE id = $2 AND role = 'doctor' 
       RETURNING id, full_name, clinic_id, email`,
      [clinicId, id]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found or already verified.' });
    }

    res.status(200).json({ 
      message: 'Doctor officially approved!', 
      doctor: updateQuery.rows[0] 
    });

  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPendingDoctors, approveDoctor };