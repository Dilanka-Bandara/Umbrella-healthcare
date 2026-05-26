const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. Log in to Cloudinary using your secret keys
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Set up the Storage Engine (Where should the files go?)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'healthtech_medical_records', // The folder name in your cloud
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], // We only allow safe files
    }
});

// 3. Create the Multer upload middleware
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };