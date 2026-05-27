require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db'); 
const pharmacyRoutes = require('./src/routes/pharmacyRoutes');

// 1. Import Routes
const consultationRoutes = require('./src/routes/consultationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes'); // Cloudinary Upload Route

// 2. Initialize the app (This MUST happen before app.use)
const app = express();
const port = process.env.PORT || 5000;

// 3. Middleware
app.use(cors());
app.use(express.json());
app.use('/api/pharmacy', pharmacyRoutes);


// 4. Use Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes); // Safe to use here!
app.use('/api/consultations', consultationRoutes);

// 5. Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HealthTech API!' });
});

// 6. Start Server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});