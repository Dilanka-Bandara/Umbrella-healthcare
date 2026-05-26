require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db'); 

// 1. Import Routes
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 2. Use Routes
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HealthTech API!' });
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});