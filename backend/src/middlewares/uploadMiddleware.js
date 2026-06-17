const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Log in to Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Set up the Storage Engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'umbrella_pharmacy', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], 
    }
});

// 3. Create the Multer upload middleware
const upload = multer({ storage: storage });

// 🚨 THE FIX: Export 'upload' directly (no curly braces!)
module.exports = upload;