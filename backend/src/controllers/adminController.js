const db = require('../config/db');

// 🔥 AUTO-MIGRATION: Prepare Database for Enterprise Admin Features
const initializeAdminDB = async () => {
  try {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';`);
    // 🚨 NEW: Add support for Medical License documents during registration
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_license_url VARCHAR(500);`);
    
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
  } catch (err) { console.log("Admin DB Check Skipped.", err.message); }
};
initializeAdminDB();

// @desc    Get High-Level Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const salesQuery = await db.query(`SELECT SUM(total_amount) as total_sales FROM orders WHERE status != 'cancelled'`);
        const totalSales = parseFloat(salesQuery.rows[0].total_sales || 0);

        const commQuery = await db.query(`SELECT setting_value FROM system_settings WHERE setting_key = 'platform_commission_percent'`);
        const commPercent = parseFloat(commQuery.rows[0].setting_value || 0);
        const platformRevenue = totalSales * (commPercent / 100);

        const docQuery = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending_docs,
                COUNT(*) FILTER (WHERE status = 'active') as active_docs,
                COUNT(*) FILTER (WHERE status = 'suspended') as suspended_docs
            FROM users WHERE role = 'doctor'
        `);

        res.status(200).json({
            total_sales: totalSales,
            platform_revenue: platformRevenue,
            commission_percent: commPercent,
            doctors: docQuery.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

// @desc    Get all doctors for moderation (Now includes License URL)
const getDoctorsList = async (req, res) => {
    try {
        const doctors = await db.query(`
            SELECT id, full_name, email, phone_number, clinic_id, status, created_at, medical_license_url 
            FROM users WHERE role = 'doctor' ORDER BY created_at DESC
        `);
        res.status(200).json(doctors.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors' });
    }
};

// @desc    Update Doctor Status (Approve, Suspend, Restore)
const updateDoctorStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        await db.query(`UPDATE users SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.status(200).json({ message: `Doctor status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

const updateCommissionRate = async (req, res) => {
    try {
        const { percentage } = req.body;
        await db.query(`UPDATE system_settings SET setting_value = $1 WHERE setting_key = 'platform_commission_percent'`, [percentage]);
        res.status(200).json({ message: 'Platform commission updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};

const getTransactions = async (req, res) => {
    try {
        const orders = await db.query(`
            SELECT o.id, o.total_amount, o.status, o.created_at, u.full_name as patient_name
            FROM orders o JOIN users u ON o.patient_id = u.id ORDER BY o.created_at DESC LIMIT 50
        `);
        res.status(200).json(orders.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

module.exports = { getDashboardStats, getDoctorsList, updateDoctorStatus, updateCommissionRate, getTransactions };