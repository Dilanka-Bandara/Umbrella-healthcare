const db = require('../config/db');

/* =========================================================================
 *  UMBRELLA HEALTHCARE — DOCTOR VERIFICATION / CREDENTIALING CONTROLLER
 *  -----------------------------------------------------------------------
 *  Matches your real database schema:
 *    users.role          -> enum user_role ('patient','doctor','admin','pharmacist')
 *    users.is_active      -> boolean  (account enabled / disabled)
 *    users.is_verified    -> boolean  (TRUE  = approved to practice,
 *                                      FALSE = pending admin approval)
 *    users.medical_license_url -> the document uploaded at registration
 *
 *  Approval model:
 *    A new doctor registers  ->  is_verified = FALSE  (PENDING)
 *    Admin reviews documents ->  approve   => is_verified = TRUE
 *                                reject    => is_verified = FALSE + reason
 *
 *  This file ADDS a verification workflow. It does not replace your
 *  general admin controller. Mount it alongside the others.
 * ======================================================================= */

// ---------------------------------------------------------------------------
//  AUTO-MIGRATION (safe / idempotent) — never drops or rewrites your data
// ---------------------------------------------------------------------------
const initVerificationDB = async () => {
  try {
    // Track WHY a doctor was rejected / when they were reviewed and by whom.
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_notes TEXT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewed_by UUID;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;`);

    // Backfill verification_status from the existing is_verified flag so the
    // queue is correct on day one (existing verified doctors => approved).
    await db.query(`
      UPDATE users
         SET verification_status = CASE WHEN is_verified = TRUE THEN 'approved' ELSE 'pending' END
       WHERE role = 'doctor' AND verification_status IS NULL;
    `);

    // A doctor can submit MULTIPLE proof documents (degree, license, board cert…).
    // medical_license_url stays as the primary doc; this table allows extras.
    await db.query(`
      CREATE TABLE IF NOT EXISTS doctor_credentials (
        id SERIAL PRIMARY KEY,
        doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doc_type VARCHAR(60) DEFAULT 'Medical License',
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Audit trail for verification decisions.
    await db.query(`
      CREATE TABLE IF NOT EXISTS verification_audit (
        id SERIAL PRIMARY KEY,
        doctor_id UUID,
        doctor_name VARCHAR(255),
        admin_id UUID,
        admin_name VARCHAR(255),
        decision VARCHAR(40),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.log('Verification DB Check Skipped.', err.message);
  }
};
initVerificationDB();

// ---------------------------------------------------------------------------
//  Helper: log a verification decision
// ---------------------------------------------------------------------------
const logDecision = async (req, doctor, decision, notes) => {
  try {
    await db.query(
      `INSERT INTO verification_audit (doctor_id, doctor_name, admin_id, admin_name, decision, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        doctor.id,
        doctor.full_name || null,
        req.user?.id || null,
        req.user?.full_name || 'Admin',
        decision,
        notes || null,
      ]
    );
  } catch (e) {
    console.log('Verification audit skipped:', e.message);
  }
};

// ---------------------------------------------------------------------------
//  DOCTOR SIDE — submit an additional credential document
//  (Your Register.jsx already saves medical_license_url. This lets a doctor
//   add degrees / extra proof after registering, e.g. from their dashboard.)
//  @route POST /api/verification/credentials   (protect, doctor)
// ---------------------------------------------------------------------------
const submitCredential = async (req, res) => {
  try {
    const doctor_id = req.user.id;
    const { file_url, file_name, doc_type } = req.body;
    if (!file_url) return res.status(400).json({ message: 'A document file_url is required.' });

    const inserted = await db.query(
      `INSERT INTO doctor_credentials (doctor_id, doc_type, file_url, file_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [doctor_id, doc_type || 'Medical License', file_url, file_name || null]
    );

    // Re-open the review queue if they were previously rejected.
    await db.query(
      `UPDATE users SET verification_status = 'pending'
       WHERE id = $1 AND COALESCE(verification_status,'pending') <> 'approved'`,
      [doctor_id]
    );

    res.status(201).json({ message: 'Document submitted for review.', credential: inserted.rows[0] });
  } catch (error) {
    console.error('submitCredential error:', error.message);
    res.status(500).json({ message: 'Failed to submit document.' });
  }
};

// ---------------------------------------------------------------------------
//  DOCTOR SIDE — check my own verification state
//  @route GET /api/verification/me   (protect, doctor)
// ---------------------------------------------------------------------------
const getMyVerification = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, is_verified, is_active,
              COALESCE(verification_status, CASE WHEN is_verified THEN 'approved' ELSE 'pending' END) AS verification_status,
              verification_notes, medical_license_url
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const docs = await db.query(
      `SELECT id, doc_type, file_url, file_name, uploaded_at
       FROM doctor_credentials WHERE doctor_id = $1 ORDER BY uploaded_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ ...r.rows[0], documents: docs.rows });
  } catch (error) {
    console.error('getMyVerification error:', error.message);
    res.status(500).json({ message: 'Failed to load verification status.' });
  }
};

// ---------------------------------------------------------------------------
//  ADMIN SIDE — the credentialing queue (with filter + counts)
//  @route GET /api/verification/queue?filter=pending|approved|rejected|all
// ---------------------------------------------------------------------------
const getVerificationQueue = async (req, res) => {
  try {
    const { filter = 'pending' } = req.query;

    const params = [];
    let where = `WHERE u.role = 'doctor'`;
    if (filter !== 'all') {
      params.push(filter);
      where += ` AND COALESCE(u.verification_status, CASE WHEN u.is_verified THEN 'approved' ELSE 'pending' END) = $${params.length}`;
    }

    const doctors = await db.query(
      `SELECT
          u.id, u.full_name, u.email, u.phone_number, u.clinic_id,
          u.medical_license_url, u.is_active, u.is_verified,
          u.created_at, u.reviewed_at, u.verification_notes,
          COALESCE(u.verification_status, CASE WHEN u.is_verified THEN 'approved' ELSE 'pending' END) AS verification_status,
          COUNT(dc.id) AS extra_doc_count
       FROM users u
       LEFT JOIN doctor_credentials dc ON dc.doctor_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      params
    );

    const counts = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(verification_status, CASE WHEN is_verified THEN 'approved' ELSE 'pending' END) = 'pending')  AS pending,
        COUNT(*) FILTER (WHERE COALESCE(verification_status, CASE WHEN is_verified THEN 'approved' ELSE 'pending' END) = 'approved') AS approved,
        COUNT(*) FILTER (WHERE COALESCE(verification_status, CASE WHEN is_verified THEN 'approved' ELSE 'pending' END) = 'rejected') AS rejected
      FROM users WHERE role = 'doctor'
    `);

    res.status(200).json({ doctors: doctors.rows, counts: counts.rows[0] });
  } catch (error) {
    console.error('getVerificationQueue error:', error.message);
    res.status(500).json({ message: 'Failed to load verification queue.' });
  }
};

// ---------------------------------------------------------------------------
//  ADMIN SIDE — full detail for one applicant (all documents)
//  @route GET /api/verification/:id
// ---------------------------------------------------------------------------
const getApplicantDetail = async (req, res) => {
  try {
    const u = await db.query(
      `SELECT id, full_name, email, phone_number, clinic_id, role,
              medical_license_url, is_active, is_verified, created_at,
              reviewed_at, verification_notes,
              COALESCE(verification_status, CASE WHEN is_verified THEN 'approved' ELSE 'pending' END) AS verification_status
       FROM users WHERE id = $1 AND role = 'doctor'`,
      [req.params.id]
    );
    if (u.rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });

    const docs = await db.query(
      `SELECT id, doc_type, file_url, file_name, uploaded_at
       FROM doctor_credentials WHERE doctor_id = $1 ORDER BY uploaded_at DESC`,
      [req.params.id]
    );

    res.status(200).json({ ...u.rows[0], documents: docs.rows });
  } catch (error) {
    console.error('getApplicantDetail error:', error.message);
    res.status(500).json({ message: 'Failed to load applicant.' });
  }
};

// ---------------------------------------------------------------------------
//  ADMIN SIDE — make a decision: approve / reject
//  @route PUT /api/verification/:id/decision   body: { decision, notes }
//  approve -> is_verified = TRUE,  is_active = TRUE,  status = 'approved'
//  reject  -> is_verified = FALSE, is_active = FALSE, status = 'rejected'
// ---------------------------------------------------------------------------
const decideVerification = async (req, res) => {
  try {
    const { decision, notes } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'approve' or 'reject'." });
    }

    const found = await db.query(
      `SELECT id, full_name FROM users WHERE id = $1 AND role = 'doctor'`,
      [req.params.id]
    );
    if (found.rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });
    const doctor = found.rows[0];

    if (decision === 'approve') {
      await db.query(
        `UPDATE users
            SET is_verified = TRUE,
                is_active = TRUE,
                verification_status = 'approved',
                verification_notes = $1,
                reviewed_by = $2,
                reviewed_at = NOW()
          WHERE id = $3`,
        [notes || null, req.user?.id || null, req.params.id]
      );
    } else {
      if (!notes || !notes.trim()) {
        return res.status(400).json({ message: 'A reason is required when rejecting an application.' });
      }
      await db.query(
        `UPDATE users
            SET is_verified = FALSE,
                is_active = FALSE,
                verification_status = 'rejected',
                verification_notes = $1,
                reviewed_by = $2,
                reviewed_at = NOW()
          WHERE id = $3`,
        [notes.trim(), req.user?.id || null, req.params.id]
      );
    }

    await logDecision(req, doctor, decision === 'approve' ? 'APPROVED' : 'REJECTED', notes);
    res.status(200).json({
      message: decision === 'approve'
        ? 'Doctor approved and granted access to the platform.'
        : 'Application rejected.',
    });
  } catch (error) {
    console.error('decideVerification error:', error.message);
    res.status(500).json({ message: 'Failed to record decision.' });
  }
};

// ---------------------------------------------------------------------------
//  ADMIN SIDE — verification decision history
//  @route GET /api/verification/audit/log
// ---------------------------------------------------------------------------
const getVerificationAudit = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, doctor_name, admin_name, decision, notes, created_at
       FROM verification_audit ORDER BY created_at DESC LIMIT 100`
    );
    res.status(200).json(r.rows);
  } catch (error) {
    console.error('getVerificationAudit error:', error.message);
    res.status(500).json({ message: 'Failed to load audit log.' });
  }
};

module.exports = {
  // doctor
  submitCredential,
  getMyVerification,
  // admin
  getVerificationQueue,
  getApplicantDetail,
  decideVerification,
  getVerificationAudit,
};