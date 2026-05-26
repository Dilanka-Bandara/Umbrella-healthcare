require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import our new database connection
const db = require('./src/config/db'); 

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HealthTech API!' });
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});