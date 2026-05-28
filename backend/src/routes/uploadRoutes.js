const express = require('express');
const router = express.Router();
const { uploadFile, uploadMultipleFiles } = require('../controllers/uploadController');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

// Route 1: Single file upload (Uses 'document' as the key)
router.post('/', upload.single('document'), uploadFile);

// Route 2: Multiple files upload (Uses 'documents' as the key, max 5 files)
router.post('/multiple', protect, upload.array('documents', 5), uploadMultipleFiles);

module.exports = router;