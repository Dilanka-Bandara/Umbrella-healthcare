const db = require('../config/db');

/* =========================================================================
 *  UMBRELLA HEALTHCARE — ENTERPRISE ADMIN CONTROLLER
 *  -----------------------------------------------------------------------
 *  Backwards compatible: all original exports are preserved
 *  (getDashboardStats, getDoctorsList, updateDoctorStatus,
 *   updateCommissionRate, getTransactions).
 *
 *  New capabilities:
 *   - Real analytics computed from orders + order_items + consultation_prescriptions + medicines
 *   - Revenue trend (last 30 days) for charting
 *   - Top selling medicines + per-medicine commission breakdown
 *   - Granular doctor permission toggles (consult / prescribe / message)
 *   - Temporary suspension with reason + audit trail (for investigations)
 *   - System-wide audit log of every admin action
 *   - Platform-wide user directory
 * ======================================================================= */

// ---------------------------------------------------------------------------
//  AUTO-MIGRATION : make the DB enterprise-ready (safe / idempotent)
// ---------------------------------------------------------------------------
const initializeAdminDB = async () => {
  try {
    // Doctor lifecycle / moderation columns
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_license_url VARCHAR(500);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;`);

    // Granular per-doctor permissions (default everything ON for active doctors)
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_consult BOOLEAN DEFAULT TRUE;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_prescribe BOOLEAN DEFAULT TRUE;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_message BOOLEAN DEFAULT TRUE;`);

    // System settings (commission etc.)
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value VARCHAR(255) NOT NULL
      );
    `);
    await db.query(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES ('platform_commission_percent', '15')
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    // Per-medicine commission overrides (optional — falls back to global %)
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2);`);

    // Admin audit log — every sensitive action is recorded here
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_id UUID,
        admin_name VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.log('Admin DB Check Skipped.', err.message);
  }
};
initializeAdminDB();

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------
const getCommissionPercent = async () => {
  const r = await db.query(
    `SELECT setting_value FROM system_settings WHERE setting_key = 'platform_commission_percent'`
  );
  return parseFloat(r.rows[0]?.setting_value || 0);
};

const writeAudit = async (req, action, targetType, targetId, details) => {
  try {
    await db.query(
      `INSERT INTO admin_audit_log (admin_id, admin_name, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user?.id || null,
        req.user?.full_name || 'Admin',
        action,
        targetType,
        targetId != null ? String(targetId) : null,
        details || null,
      ]
    );
  } catch (e) {
    console.log('Audit write skipped:', e.message);
  }
};

// A reusable subquery that computes the real "line revenue" for every sold item.
// Sales are stored across orders -> order_items -> consultation_prescriptions -> medicines.
// order_items.price_at_purchase is 0 in the current checkout flow, so we fall back
// to (quantity * medicines.price) which reflects the true value of the sale.
const LINE_REVENUE_SQL = `
  COALESCE(NULLIF(oi.price_at_purchase, 0), m.price) * oi.quantity
`;

// ---------------------------------------------------------------------------
//  1. HIGH-LEVEL DASHBOARD STATS   (original endpoint, upgraded internals)
// ---------------------------------------------------------------------------
const getDashboardStats = async (req, res) => {
  try {
    const commPercent = await getCommissionPercent();

    // Gross sales straight from the orders ledger (excluding cancelled)
    const salesQuery = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_sales,
              COUNT(*) AS total_orders
       FROM orders
       WHERE status IS DISTINCT FROM 'cancelled'`
    );
    const totalSales = parseFloat(salesQuery.rows[0].total_sales || 0);
    const totalOrders = parseInt(salesQuery.rows[0].total_orders || 0);

    // Net platform revenue from per-line data, honouring per-medicine overrides
    const revenueQuery = await db.query(
      `SELECT COALESCE(SUM(
          (${LINE_REVENUE_SQL}) * (COALESCE(m.commission_percent, $1) / 100.0)
       ), 0) AS platform_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id AND o.status IS DISTINCT FROM 'cancelled'
       JOIN consultation_prescriptions cp ON oi.prescription_id = cp.id
       JOIN medicines m ON cp.medicine_id = m.id`,
      [commPercent]
    );
    let platformRevenue = parseFloat(revenueQuery.rows[0].platform_revenue || 0);

    // Fallback: if per-line data is empty (older orders), use flat % of gross
    if (platformRevenue === 0 && totalSales > 0) {
      platformRevenue = totalSales * (commPercent / 100);
    }

    const docQuery = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')   AS pending_docs,
        COUNT(*) FILTER (WHERE status = 'active')     AS active_docs,
        COUNT(*) FILTER (WHERE status = 'suspended')  AS suspended_docs
      FROM users WHERE role = 'doctor'
    `);

    const patientQuery = await db.query(
      `SELECT COUNT(*) AS total_patients FROM users WHERE role = 'patient'`
    );

    const aov = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.status(200).json({
      total_sales: totalSales,
      platform_revenue: platformRevenue,
      commission_percent: commPercent,
      total_orders: totalOrders,
      average_order_value: aov,
      total_patients: parseInt(patientQuery.rows[0].total_patients || 0),
      doctors: docQuery.rows[0],
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// ---------------------------------------------------------------------------
//  2. REVENUE TREND (last 30 days) — for the dashboard line chart
// ---------------------------------------------------------------------------
const getRevenueTrend = async (req, res) => {
  try {
    const commPercent = await getCommissionPercent();
    const result = await db.query(
      `SELECT
          to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD') AS day,
          COALESCE(SUM(o.total_amount), 0) AS gross
       FROM orders o
       WHERE o.created_at >= NOW() - INTERVAL '30 days'
         AND o.status IS DISTINCT FROM 'cancelled'
       GROUP BY day
       ORDER BY day ASC`
    );
    const trend = result.rows.map((r) => ({
      day: r.day,
      gross: parseFloat(r.gross),
      revenue: parseFloat(r.gross) * (commPercent / 100),
    }));
    res.status(200).json(trend);
  } catch (error) {
    console.error('Trend error:', error.message);
    res.status(500).json({ message: 'Error fetching revenue trend' });
  }
};

// ---------------------------------------------------------------------------
//  3. TOP MEDICINES + per-medicine commission breakdown
// ---------------------------------------------------------------------------
const getMedicineBreakdown = async (req, res) => {
  try {
    const commPercent = await getCommissionPercent();
    const result = await db.query(
      `SELECT
          m.id,
          m.name,
          m.type,
          m.price,
          m.commission_percent,
          COALESCE(SUM(oi.quantity), 0) AS units_sold,
          COALESCE(SUM(${LINE_REVENUE_SQL}), 0) AS gross_sales,
          COALESCE(SUM(
            (${LINE_REVENUE_SQL}) * (COALESCE(m.commission_percent, $1) / 100.0)
          ), 0) AS platform_earned
       FROM medicines m
       LEFT JOIN consultation_prescriptions cp ON cp.medicine_id = m.id
       LEFT JOIN order_items oi ON oi.prescription_id = cp.id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status IS DISTINCT FROM 'cancelled'
       GROUP BY m.id, m.name, m.type, m.price, m.commission_percent
       ORDER BY units_sold DESC, m.name ASC`,
      [commPercent]
    );

    const rows = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      price: parseFloat(r.price || 0),
      effective_commission: r.commission_percent != null ? parseFloat(r.commission_percent) : commPercent,
      is_custom_commission: r.commission_percent != null,
      units_sold: parseInt(r.units_sold || 0),
      gross_sales: parseFloat(r.gross_sales || 0),
      platform_earned: parseFloat(r.platform_earned || 0),
    }));
    res.status(200).json(rows);
  } catch (error) {
    console.error('Medicine breakdown error:', error.message);
    res.status(500).json({ message: 'Error fetching medicine breakdown' });
  }
};

// ---------------------------------------------------------------------------
//  4. SET PER-MEDICINE COMMISSION OVERRIDE  (null = use global rate)
// ---------------------------------------------------------------------------
const updateMedicineCommission = async (req, res) => {
  try {
    const { id } = req.params;
    let { commission_percent } = req.body; // number or null

    if (commission_percent === '' || commission_percent === undefined) commission_percent = null;
    if (commission_percent !== null) {
      const v = parseFloat(commission_percent);
      if (isNaN(v) || v < 0 || v > 100) {
        return res.status(400).json({ message: 'Commission must be between 0 and 100.' });
      }
      commission_percent = v;
    }

    await db.query(`UPDATE medicines SET commission_percent = $1 WHERE id = $2`, [
      commission_percent,
      id,
    ]);
    await writeAudit(
      req,
      'UPDATE_MEDICINE_COMMISSION',
      'medicine',
      id,
      commission_percent === null
        ? 'Reset to global rate'
        : `Set custom commission to ${commission_percent}%`
    );
    res.status(200).json({ message: 'Medicine commission updated.' });
  } catch (error) {
    console.error('Medicine commission error:', error.message);
    res.status(500).json({ message: 'Error updating medicine commission' });
  }
};

// ---------------------------------------------------------------------------
//  5. DOCTOR LIST (original endpoint, upgraded with permission flags)
// ---------------------------------------------------------------------------
const getDoctorsList = async (req, res) => {
  try {
    const doctors = await db.query(`
      SELECT id, full_name, email, phone_number, clinic_id, status, created_at,
             medical_license_url, suspension_reason, suspended_at,
             COALESCE(can_consult, true)   AS can_consult,
             COALESCE(can_prescribe, true) AS can_prescribe,
             COALESCE(can_message, true)   AS can_message
      FROM users WHERE role = 'doctor' ORDER BY created_at DESC
    `);
    res.status(200).json(doctors.rows);
  } catch (error) {
    console.error('Doctors list error:', error.message);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
};

// ---------------------------------------------------------------------------
//  6. UPDATE DOCTOR STATUS (original endpoint, upgraded with reason + audit)
//     Temporary suspension for investigations sets suspended_at + reason.
//     Restoring re-enables all permissions and clears the suspension flags.
// ---------------------------------------------------------------------------
const updateDoctorStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const allowed = ['active', 'pending', 'suspended'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    if (status === 'suspended') {
      // Temporary disable: keep the account but cut off platform privileges
      await db.query(
        `UPDATE users
           SET status = 'suspended',
               suspension_reason = $1,
               suspended_at = NOW(),
               can_consult = FALSE,
               can_prescribe = FALSE,
               can_message = FALSE
         WHERE id = $2`,
        [reason || 'Temporarily disabled pending review', req.params.id]
      );
    } else if (status === 'active') {
      // Restore full access
      await db.query(
        `UPDATE users
           SET status = 'active',
               suspension_reason = NULL,
               suspended_at = NULL,
               can_consult = TRUE,
               can_prescribe = TRUE,
               can_message = TRUE
         WHERE id = $1`,
        [req.params.id]
      );
    } else {
      await db.query(`UPDATE users SET status = $1 WHERE id = $2`, [status, req.params.id]);
    }

    await writeAudit(
      req,
      'UPDATE_DOCTOR_STATUS',
      'doctor',
      req.params.id,
      `Status -> ${status}${reason ? ` | Reason: ${reason}` : ''}`
    );
    res.status(200).json({ message: `Doctor status updated to ${status}` });
  } catch (error) {
    console.error('Status update error:', error.message);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// ---------------------------------------------------------------------------
//  7. TOGGLE A SINGLE DOCTOR PERMISSION (granular control)
//     permission in: consult | prescribe | message
// ---------------------------------------------------------------------------
const updateDoctorPermission = async (req, res) => {
  try {
    const { permission, value } = req.body;
    const map = {
      consult: 'can_consult',
      prescribe: 'can_prescribe',
      message: 'can_message',
    };
    const col = map[permission];
    if (!col) return res.status(400).json({ message: 'Unknown permission.' });

    await db.query(`UPDATE users SET ${col} = $1 WHERE id = $2`, [!!value, req.params.id]);
    await writeAudit(
      req,
      'TOGGLE_DOCTOR_PERMISSION',
      'doctor',
      req.params.id,
      `${permission} -> ${value ? 'ENABLED' : 'DISABLED'}`
    );
    res.status(200).json({ message: `Permission '${permission}' set to ${value}` });
  } catch (error) {
    console.error('Permission update error:', error.message);
    res.status(500).json({ message: 'Error updating permission' });
  }
};

// ---------------------------------------------------------------------------
//  8. UPDATE GLOBAL COMMISSION (original endpoint, upgraded with audit)
// ---------------------------------------------------------------------------
const updateCommissionRate = async (req, res) => {
  try {
    const { percentage } = req.body;
    const v = parseFloat(percentage);
    if (isNaN(v) || v < 0 || v > 100) {
      return res.status(400).json({ message: 'Commission must be between 0 and 100.' });
    }
    await db.query(
      `UPDATE system_settings SET setting_value = $1 WHERE setting_key = 'platform_commission_percent'`,
      [String(v)]
    );
    await writeAudit(req, 'UPDATE_GLOBAL_COMMISSION', 'system', 'platform_commission_percent', `${v}%`);
    res.status(200).json({ message: 'Platform commission updated successfully!' });
  } catch (error) {
    console.error('Commission error:', error.message);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// ---------------------------------------------------------------------------
//  9. TRANSACTIONS (original endpoint, upgraded: item count + commission + filters)
// ---------------------------------------------------------------------------
const getTransactions = async (req, res) => {
  try {
    const commPercent = await getCommissionPercent();
    const { status, search } = req.query;

    const where = [];
    const params = [commPercent];
    if (status && status !== 'all') {
      params.push(status);
      where.push(`o.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`u.full_name ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const orders = await db.query(
      `SELECT
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          o.shipping_address,
          u.full_name AS patient_name,
          u.email AS patient_email,
          COALESCE(SUM(oi.quantity), 0) AS item_count,
          (o.total_amount * ($1 / 100.0)) AS platform_cut
       FROM orders o
       JOIN users u ON o.patient_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${whereSql}
       GROUP BY o.id, u.full_name, u.email
       ORDER BY o.created_at DESC
       LIMIT 100`,
      params
    );
    res.status(200).json(orders.rows);
  } catch (error) {
    console.error('Transactions error:', error.message);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// ---------------------------------------------------------------------------
//  10. PLATFORM USER DIRECTORY (patients + doctors + admins)
// ---------------------------------------------------------------------------
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const params = [];
    let roleSql = '';
    if (role && role !== 'all') {
      params.push(role);
      roleSql = `WHERE role = $${params.length}`;
    }
    const result = await db.query(
      `SELECT id, full_name, email, phone_number, role,
              COALESCE(status, 'active') AS status, created_at
       FROM users ${roleSql}
       ORDER BY created_at DESC LIMIT 500`,
      params
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Users error:', error.message);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// ---------------------------------------------------------------------------
//  11. AUDIT LOG — read recent admin actions
// ---------------------------------------------------------------------------
const getAuditLog = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, admin_name, action, target_type, target_id, details, created_at
       FROM admin_audit_log ORDER BY created_at DESC LIMIT 100`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Audit error:', error.message);
    res.status(500).json({ message: 'Error fetching audit log' });
  }
};

module.exports = {
  // original
  getDashboardStats,
  getDoctorsList,
  updateDoctorStatus,
  updateCommissionRate,
  getTransactions,
  // new enterprise endpoints
  getRevenueTrend,
  getMedicineBreakdown,
  updateMedicineCommission,
  updateDoctorPermission,
  getAllUsers,
  getAuditLog,
};