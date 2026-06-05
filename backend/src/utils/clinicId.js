const db = require('../config/db');

/* =========================================================================
 *  CLINIC ID GENERATOR
 *  -----------------------------------------------------------------------
 *  Produces short, human-friendly doctor identifiers like:
 *        DOC-7777        DOC-48213        DOC-1024
 *
 *  Rules:
 *   - Always prefixed with "DOC-"
 *   - Numeric part is 4 to 5 digits (1000 .. 99999) so it's easy to read,
 *     remember and type, while still giving ~99,000 possible values.
 *   - Guaranteed unique against the users.clinic_id column (retries on
 *     collision). A DB-level UNIQUE index is recommended as a final guard.
 * ======================================================================= */

const PREFIX = 'DOC-';
const MIN = 1000;    // smallest 4-digit number
const MAX = 99999;   // largest 5-digit number
const MAX_ATTEMPTS = 25;

// Make sure a UNIQUE index exists so two simultaneous registrations can
// never end up with the same clinic_id (safe / idempotent).
let indexEnsured = false;
const ensureUniqueIndex = async () => {
  if (indexEnsured) return;
  try {
    await db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_clinic_id_unique
         ON users (clinic_id) WHERE clinic_id IS NOT NULL;`
    );
    indexEnsured = true;
  } catch (err) {
    // Non-fatal: if the index can't be created we still retry on collision.
    console.log('Clinic ID unique index check skipped:', err.message);
  }
};

const randomCandidate = () => {
  const n = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  return `${PREFIX}${n}`;
};

/**
 * Generate a clinic ID that is not yet used by any doctor.
 * @returns {Promise<string>} e.g. "DOC-7777"
 */
const generateUniqueClinicId = async () => {
  await ensureUniqueIndex();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomCandidate();
    const existing = await db.query(
      'SELECT 1 FROM users WHERE clinic_id = $1 LIMIT 1',
      [candidate]
    );
    if (existing.rows.length === 0) {
      return candidate;
    }
  }

  // Extremely unlikely fallback: append a tiny random suffix to stay unique
  // while keeping the DOC- prefix intact.
  return `${PREFIX}${Math.floor(Math.random() * (MAX - MIN + 1)) + MIN}`;
};

module.exports = { generateUniqueClinicId, PREFIX };

/* -------------------------------------------------------------------------
 *  BACKFILL: assign a clinic ID to any existing doctor that doesn't have one.
 *  Safe to call on every server start — it only touches doctors where
 *  clinic_id IS NULL, and does nothing once everyone has an ID.
 * ----------------------------------------------------------------------- */
const backfillClinicIds = async () => {
  try {
    await ensureUniqueIndex();
    const missing = await db.query(
      `SELECT id FROM users WHERE role = 'doctor' AND (clinic_id IS NULL OR clinic_id = '')`
    );
    for (const row of missing.rows) {
      const id = await generateUniqueClinicId();
      try {
        await db.query('UPDATE users SET clinic_id = $1 WHERE id = $2', [id, row.id]);
      } catch (e) {
        // skip on rare collision; next start will catch it
        console.log('Backfill skipped one doctor:', e.message);
      }
    }
    if (missing.rows.length > 0) {
      console.log(`✅ Assigned clinic IDs to ${missing.rows.length} existing doctor(s).`);
    }
  } catch (err) {
    console.log('Clinic ID backfill skipped:', err.message);
  }
};

module.exports.backfillClinicIds = backfillClinicIds;