const express = require('express');
const router = express.Router();

// 1. Import everything EXCEPT addProduct from storeController
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

// 2. 🚨 THE FIX: Import addProduct from the correct file!
const { addProduct } = require('../controllers/pharmacyController');

// 3. Import your middlewares
const { protect, authorizeRole } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');


/* ---------------- PUBLIC-ISH CATALOG (any logged-in user can browse) ---------------- */
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

/* ---------------- INVENTORY UPLOAD (Pharmacist / Admin) ---------------- */
// 1. protect: Verifies the JWT Token
// 2. authorizeRole: Only allows 'pharmacist' or 'admin' roles
// 3. upload.single('image'): Intercepts the photo and sends it to Cloudinary
// 4. addProduct: Saves everything to PostgreSQL
router.post(
  '/inventory', 
  protect, 
  authorizeRole('pharmacist', 'admin'), 
  upload.single('image'), 
  addProduct
);

module.exports = router;