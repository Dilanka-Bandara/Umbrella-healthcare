const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'healthtech_pharmacy', // All your medicine photos will go to this folder in Cloudinary!
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }] // Auto-resize to keep your app fast
  }
});

const upload = multer({ storage: storage });

module.exports = upload;