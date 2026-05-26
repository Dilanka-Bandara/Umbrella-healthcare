// 1. Import dependencies
require('dotenv').config(); // Loads our secret passwords
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL client

// 2. Initialize the app
const app = express();
const port = process.env.PORT || 5000;

// 3. Setup Middleware (Security and Data handling)
app.use(cors()); // Allows your Next.js frontend to talk to this backend
app.use(express.json()); // Allows the server to understand JSON data (like form submissions)

// 4. Configure Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 5. Test Database Connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Database connection failed:', err.stack);
    }
    console.log('✅ Successfully connected to PostgreSQL database!');
    release(); // Release the client back to the pool
});

// 6. Create a basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HealthTech API!' });
});

// 7. Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});