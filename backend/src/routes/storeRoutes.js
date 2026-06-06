const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/storeController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

/* ---------------- PUBLIC-ISH CATALOG (any logged-in user can browse) ----------------
 * We use `protect` so getProduct can show the patient's personal permission state.
 * If you want the catalog visible to logged-out visitors too, drop `protect`
 * from getCatalog/getCategories. */
router.get('/catalog', protect, getCatalog);
router.get('/categories', protect, getCategories);
router.get('/product/:id', protect, getProduct);

/* ---------------- SPECIAL-PERMISSION FLOW (patient) ---------------- */
router.get('/permission/doctors', protect, authorizeRole('patient'), getRequestableDoctors);
router.post('/permission/request', protect, authorizeRole('patient'), requestPermission);
router.get('/permission/my-requests', protect, authorizeRole('patient'), getMyRequests);

/* ---------------- SPECIAL-PERMISSION FLOW (doctor) ---------------- */
router.get('/permission/incoming', protect, authorizeRole('doctor'), getIncomingRequests);
router.put('/permission/:id/decide', protect, authorizeRole('doctor'), decidePermission);

/* ---------------- CHECKOUT + ORDERS (patient) ---------------- */
router.post('/checkout', protect, authorizeRole('patient'), storeCheckout);
router.get('/orders', protect, authorizeRole('patient'), getMyOrders);

module.exports = router;