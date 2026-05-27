require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // NEW: Required for Socket.io
const { Server } = require('socket.io'); // NEW: Import Socket.io
const db = require('./src/config/db'); 

// Import Routes
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const consultationRoutes = require('./src/routes/consultationRoutes');
const pharmacyRoutes = require('./src/routes/pharmacyRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');

// Initialize the app
const app = express();
const port = process.env.PORT || 5000;

// NEW: Create an HTTP server and attach Express and Socket.io to it
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows your frontend to connect from anywhere
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/appointments', appointmentRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HealthTech API!' });
});

// NEW: Listen for Socket.io connections!
io.on('connection', (socket) => {
    console.log(`🔌 A user connected to the chat! Socket ID: ${socket.id}`);

    // If a user disconnects
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Start Server (Notice we use server.listen now, not app.listen)
server.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`💬 Real-time Chat Engine is ONLINE`);
});