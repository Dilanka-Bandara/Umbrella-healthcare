const db = require('../config/db');

/* =========================================================================
 *  UMBRELLA HEALTHCARE — STOREFRONT (E-PHARMACY) CONTROLLER
 *  -----------------------------------------------------------------------
 *  Works against the real schema:
 *    medicines(id, name, dosage, type, price, stock_quantity,
 *              requires_prescription, ...)
 *    manual_prescription_approvals(id, patient_id, doctor_id, medicine_id,
 *              status, valid_until, ...)   <- the "special permission" table
 *    orders / order_items                  <- shared order ledger
 *
 *  Three tiers of buying:
 *    1. OTC  (requires_prescription = false)  -> anyone logged in can buy
 *    2. Special-permission (requires_prescription = true) -> needs an
 *       APPROVED manual_prescription_approvals row (doctor grants it after
 *       chatting with the patient)
 *    3. Consultation prescriptions -> handled by the existing pharmacy cart
 * ======================================================================= */

// ---------------------------------------------------------------------------
//  AUTO-MIGRATION (safe / idempotent) — adds storefront-friendly fields
// ---------------------------------------------------------------------------
const initStorefront = async () => {
  try {
    // Catalog metadata for a proper storefront (all optional, safe defaults)
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS category VARCHAR(80) DEFAULT 'General';`);
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS description TEXT;`);
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS usage_instructions TEXT;`);
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS warnings TEXT;`);
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);`);
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS brand VARCHAR(120);`);
    await db.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10;`);

    // A reason field so a patient can explain why they need a special medicine
    await db.query(`ALTER TABLE manual_prescription_approvals ADD COLUMN IF NOT EXISTS patient_note TEXT;`);
    await db.query(`ALTER TABLE manual_prescription_approvals ADD COLUMN IF NOT EXISTS doctor_note TEXT;`);
  } catch (err) {
    console.log('Storefront DB check skipped:', err.message);
  }
};
initStorefront();

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------
const stockState = (qty, threshold) => {
  const q = parseInt(qty || 0);
  const t = parseInt(threshold || 10);
  if (q <= 0) return 'out_of_stock';
  if (q <= t) return 'low_stock';
  return 'in_stock';
};

const decorate = (m) => ({
  ...m,
  price: parseFloat(m.price || 0),
  stock_quantity: parseInt(m.stock_quantity || 0),
  stock_state: stockState(m.stock_quantity, m.low_stock_threshold),
  // 'requires_prescription' is the special-permission flag
  is_special: m.requires_prescription === true,
});

// ---------------------------------------------------------------------------
//  1. CATALOG — browse with search, category filter, sort, pagination
//  @route GET /api/store/catalog
//    ?search=&category=&sort=name|price_asc|price_desc&otc_only=true&page=1
// ---------------------------------------------------------------------------
const getCatalog = async (req, res) => {
  try {
    const { search, category, sort, otc_only, page = 1, limit = 24 } = req.query;

    const where = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(name ILIKE $${params.length} OR brand ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (category && category !== 'all') {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (otc_only === 'true') {
      where.push(`requires_prescription = false`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let orderSql = 'ORDER BY name ASC';
    if (sort === 'price_asc') orderSql = 'ORDER BY price ASC';
    else if (sort === 'price_desc') orderSql = 'ORDER BY price DESC';
    else if (sort === 'name') orderSql = 'ORDER BY name ASC';

    const lim = Math.min(parseInt(limit) || 24, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

    const countRes = await db.query(`SELECT COUNT(*) FROM medicines ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(lim);
    params.push(offset);
    const rows = await db.query(
      `SELECT * FROM medicines ${whereSql} ${orderSql} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.status(200).json({
      items: rows.rows.map(decorate),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / lim),
    });
  } catch (error) {
    console.error('getCatalog error:', error.message);
    res.status(500).json({ message: 'Error loading catalog' });
  }
};

// ---------------------------------------------------------------------------
//  2. CATEGORIES — distinct list for the storefront filter bar
//  @route GET /api/store/categories
// ---------------------------------------------------------------------------
const getCategories = async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT COALESCE(category, 'General') AS category, COUNT(*) AS count
       FROM medicines GROUP BY COALESCE(category, 'General') ORDER BY category ASC`
    );
    res.status(200).json(rows.rows.map((r) => ({ category: r.category, count: parseInt(r.count) })));
  } catch (error) {
    console.error('getCategories error:', error.message);
    res.status(500).json({ message: 'Error loading categories' });
  }
};

// ---------------------------------------------------------------------------
//  3. PRODUCT DETAIL — single medicine, plus this patient's permission state
//  @route GET /api/store/product/:id
// ---------------------------------------------------------------------------
const getProduct = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });

    const product = decorate(result.rows[0]);

    // If special and the user is logged in, tell them whether they're approved
    let permission = null;
    if (product.is_special && req.user?.id) {
      const appr = await db.query(
        `SELECT status, valid_until FROM manual_prescription_approvals
         WHERE patient_id = $1 AND medicine_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [req.user.id, req.params.id]
      );
      if (appr.rows.length > 0) {
        const row = appr.rows[0];
        const valid = row.status === 'approved' && (!row.valid_until || new Date(row.valid_until) > new Date());
        permission = { status: row.status, valid_until: row.valid_until, can_buy: valid };
      } else {
        permission = { status: 'none', can_buy: false };
      }
    }

    res.status(200).json({ ...product, permission });
  } catch (error) {
    console.error('getProduct error:', error.message);
    res.status(500).json({ message: 'Error loading product' });
  }
};

// ---------------------------------------------------------------------------
//  4. SPECIAL-PERMISSION: list doctors a patient can request from
//     = their connected doctors + curated specialists (is_specialist flag)
//  @route GET /api/store/permission/doctors
// ---------------------------------------------------------------------------
const getRequestableDoctors = async (req, res) => {
  try {
    const patient_id = req.user.id;

    // Connected doctors
    const connected = await db.query(
      `SELECT DISTINCT u.id, u.full_name, u.clinic_id, 'connected' AS source
       FROM users u
       JOIN patient_doctor_connections pdc ON u.id = pdc.doctor_id
       WHERE pdc.patient_id = $1 AND u.role = 'doctor' AND u.is_verified = true`,
      [patient_id]
    );

    // Curated specialists (doctors flagged as available for special approvals).
    // Falls back gracefully if the flag column doesn't exist yet.
    let specialists = { rows: [] };
    try {
      specialists = await db.query(
        `SELECT id, full_name, clinic_id, 'specialist' AS source
         FROM users
         WHERE role = 'doctor' AND is_verified = true
           AND COALESCE(is_specialist, false) = true`
      );
    } catch (e) {
      // is_specialist column may not exist; show all verified doctors as a fallback
      specialists = await db.query(
        `SELECT id, full_name, clinic_id, 'available' AS source
         FROM users WHERE role = 'doctor' AND is_verified = true LIMIT 20`
      );
    }

    // Merge unique by id, connected first
    const map = new Map();
    [...connected.rows, ...specialists.rows].forEach((d) => {
      if (!map.has(d.id)) map.set(d.id, d);
    });

    res.status(200).json(Array.from(map.values()));
  } catch (error) {
    console.error('getRequestableDoctors error:', error.message);
    res.status(500).json({ message: 'Error loading doctors' });
  }
};

// ---------------------------------------------------------------------------
//  5. SPECIAL-PERMISSION: patient requests approval for a special medicine
//  @route POST /api/store/permission/request
//    body: { medicine_id, doctor_id, patient_note }
//  Creates a 'pending' manual_prescription_approvals row tied to a doctor.
//  The doctor will chat with the patient (existing chat system) then decide.
// ---------------------------------------------------------------------------
const requestPermission = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { medicine_id, doctor_id, patient_note } = req.body;

    if (!medicine_id || !doctor_id) {
      return res.status(400).json({ message: 'medicine_id and doctor_id are required.' });
    }

    // Confirm the medicine actually needs permission
    const med = await db.query('SELECT requires_prescription, name FROM medicines WHERE id = $1', [medicine_id]);
    if (med.rows.length === 0) return res.status(404).json({ message: 'Medicine not found.' });
    if (med.rows[0].requires_prescription !== true) {
      return res.status(400).json({ message: 'This medicine does not require special permission.' });
    }

    // Avoid duplicate pending requests for the same medicine
    const existing = await db.query(
      `SELECT id, status FROM manual_prescription_approvals
       WHERE patient_id = $1 AND medicine_id = $2 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [patient_id, medicine_id]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'You already have a pending request for this medicine.',
        request_id: existing.rows[0].id,
        doctor_id,
      });
    }

    const inserted = await db.query(
      `INSERT INTO manual_prescription_approvals
         (patient_id, doctor_id, medicine_id, status, patient_note)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING id`,
      [patient_id, doctor_id, medicine_id, patient_note || null]
    );

    res.status(201).json({
      message: 'Request sent. Start a chat with the doctor so they can review and approve.',
      request_id: inserted.rows[0].id,
      doctor_id, // so the frontend can open the chat room with this doctor
    });
  } catch (error) {
    console.error('requestPermission error:', error.message);
    res.status(500).json({ message: 'Error creating request.' });
  }
};

// ---------------------------------------------------------------------------
//  6. SPECIAL-PERMISSION: patient views their own requests
//  @route GET /api/store/permission/my-requests
// ---------------------------------------------------------------------------
const getMyRequests = async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT mpa.id, mpa.status, mpa.valid_until, mpa.patient_note, mpa.doctor_note,
              mpa.created_at, mpa.doctor_id,
              m.id AS medicine_id, m.name AS medicine_name, m.price,
              u.full_name AS doctor_name
       FROM manual_prescription_approvals mpa
       JOIN medicines m ON mpa.medicine_id = m.id
       LEFT JOIN users u ON mpa.doctor_id = u.id
       WHERE mpa.patient_id = $1
       ORDER BY mpa.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json(rows.rows.map((r) => ({ ...r, price: parseFloat(r.price || 0) })));
  } catch (error) {
    console.error('getMyRequests error:', error.message);
    res.status(500).json({ message: 'Error loading requests.' });
  }
};

// ---------------------------------------------------------------------------
//  7. SPECIAL-PERMISSION (DOCTOR SIDE): incoming requests for this doctor
//  @route GET /api/store/permission/incoming
// ---------------------------------------------------------------------------
const getIncomingRequests = async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT mpa.id, mpa.status, mpa.patient_note, mpa.created_at,
              mpa.patient_id, mpa.medicine_id,
              m.name AS medicine_name, m.dosage,
              u.full_name AS patient_name, u.id AS patient_user_id
       FROM manual_prescription_approvals mpa
       JOIN medicines m ON mpa.medicine_id = m.id
       JOIN users u ON mpa.patient_id = u.id
       WHERE mpa.doctor_id = $1
       ORDER BY (mpa.status = 'pending') DESC, mpa.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json(rows.rows);
  } catch (error) {
    console.error('getIncomingRequests error:', error.message);
    res.status(500).json({ message: 'Error loading incoming requests.' });
  }
};

// ---------------------------------------------------------------------------
//  8. SPECIAL-PERMISSION (DOCTOR SIDE): approve / reject a request
//  @route PUT /api/store/permission/:id/decide
//    body: { decision: 'approve'|'reject', doctor_note, valid_days }
// ---------------------------------------------------------------------------
const decidePermission = async (req, res) => {
  try {
    const { decision, doctor_note, valid_days } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'approve' or 'reject'." });
    }

    // Make sure this request belongs to the requesting doctor
    const found = await db.query(
      `SELECT id FROM manual_prescription_approvals WHERE id = $1 AND doctor_id = $2`,
      [req.params.id, req.user.id]
    );
    if (found.rows.length === 0) {
      return res.status(403).json({ message: 'This request is not assigned to you.' });
    }

    if (decision === 'approve') {
      const days = parseInt(valid_days) > 0 ? parseInt(valid_days) : 30;
      await db.query(
        `UPDATE manual_prescription_approvals
            SET status = 'approved',
                doctor_note = $1,
                valid_until = NOW() + ($2 || ' days')::interval,
                updated_at = NOW()
          WHERE id = $3`,
        [doctor_note || null, String(days), req.params.id]
      );
      res.status(200).json({ message: `Approved. Patient can purchase for ${days} days.` });
    } else {
      await db.query(
        `UPDATE manual_prescription_approvals
            SET status = 'rejected', doctor_note = $1, updated_at = NOW()
          WHERE id = $2`,
        [doctor_note || null, req.params.id]
      );
      res.status(200).json({ message: 'Request rejected.' });
    }
  } catch (error) {
    console.error('decidePermission error:', error.message);
    res.status(500).json({ message: 'Error recording decision.' });
  }
};

// ---------------------------------------------------------------------------
//  9. STOREFRONT CHECKOUT (transactional) — OTC + approved special meds
//  @route POST /api/store/checkout
//    body: { cart: [{medicine_id, quantity}], shipping_address }
//  Mirrors the safety of the existing checkoutController: verify everything,
//  then execute, all inside a single DB transaction.
// ---------------------------------------------------------------------------
const storeCheckout = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const patient_id = req.user.id;
    const { cart, shipping_address } = req.body;

    if (!shipping_address) throw new Error('Shipping address is required.');
    if (!Array.isArray(cart) || cart.length === 0) throw new Error('Your cart is empty.');

    let total = 0;
    const verified = [];

    // ---------- PHASE 1: VERIFY EVERYTHING ----------
    for (const item of cart) {
      const { medicine_id, quantity } = item;
      const qty = parseInt(quantity);
      if (!medicine_id || !qty || qty <= 0) throw new Error('Invalid item quantity.');

      const medRes = await client.query('SELECT * FROM medicines WHERE id = $1', [medicine_id]);
      if (medRes.rows.length === 0) throw new Error('A medicine in your cart no longer exists.');
      const med = medRes.rows[0];

      if (med.stock_quantity < qty) {
        throw new Error(`Only ${med.stock_quantity} unit(s) of ${med.name} left in stock.`);
      }

      // Special-permission gate
      if (med.requires_prescription === true) {
        const appr = await client.query(
          `SELECT id FROM manual_prescription_approvals
           WHERE patient_id = $1 AND medicine_id = $2 AND status = 'approved'
             AND (valid_until IS NULL OR valid_until > NOW())
           LIMIT 1`,
          [patient_id, medicine_id]
        );
        if (appr.rows.length === 0) {
          throw new Error(`You need doctor approval to buy ${med.name}.`);
        }
      }

      const price = parseFloat(med.price);
      total += price * qty;
      verified.push({ med, qty, price });
    }

    // ---------- PHASE 2: EXECUTE ----------
    const orderRes = await client.query(
      `INSERT INTO orders (patient_id, total_amount, shipping_address, status)
       VALUES ($1, $2, $3, 'processing') RETURNING id`,
      [patient_id, total.toFixed(2), shipping_address]
    );
    const order_id = orderRes.rows[0].id;

    for (const v of verified) {
      await client.query(
        'UPDATE medicines SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [v.qty, v.med.id]
      );
      // order_items has product_id column; we store the medicine id there
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order_id, v.med.id, v.qty, v.price]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({
      message: 'Order placed successfully! Your items are being prepared.',
      order_id,
      total_paid: total.toFixed(2),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('storeCheckout error:', error.message);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
//  10. ORDER HISTORY + tracking (patient)
//  @route GET /api/store/orders
// ---------------------------------------------------------------------------
const getMyOrders = async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT o.id, o.total_amount, o.status, o.shipping_address,
              o.courier_tracking_id, o.created_at,
              COALESCE(SUM(oi.quantity), 0) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.patient_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Attach line items per order
    const result = [];
    for (const o of orders.rows) {
      const items = await db.query(
        `SELECT oi.quantity, oi.price_at_purchase, m.name AS medicine_name, m.type
         FROM order_items oi
         LEFT JOIN medicines m ON oi.product_id = m.id
         WHERE oi.order_id = $1`,
        [o.id]
      );
      result.push({
        ...o,
        total_amount: parseFloat(o.total_amount || 0),
        item_count: parseInt(o.item_count),
        items: items.rows.map((i) => ({ ...i, price_at_purchase: parseFloat(i.price_at_purchase || 0) })),
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('getMyOrders error:', error.message);
    res.status(500).json({ message: 'Error loading orders.' });
  }
};

module.exports = {
  getCatalog,
  getCategories,
  getProduct,
  getRequestableDoctors,
  requestPermission,
  getMyRequests,
  getIncomingRequests,
  decidePermission,
  storeCheckout,
  getMyOrders,
};