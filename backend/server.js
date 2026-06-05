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
const messageRoutes = require('./src/routes/messageRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

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
app.use('/api/messages', messageRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/doctors', require('./src/routes/doctorRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/verification', require('./src/routes/verificationRoutes'));


// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HealthTech API!' });
});

// NEW: Listen for Socket.io connections!
io.on('connection', (socket) => {
    console.log(`🔌 A user connected to the chat! Socket ID: ${socket.id}`);

    // 1. Join a private chat room
    // The frontend will send a unique room ID (usually the two user IDs combined)
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User joined private room: ${room}`);
    });

    // 2. Listen for new messages being sent
    socket.on('send_message', async (data) => {
        // data expects: { sender_id, receiver_id, message_text, room }
        try {
            // A. Save the message to the database immediately
            const savedMsg = await db.query(
                `INSERT INTO messages (sender_id, receiver_id, message_text) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [data.sender_id, data.receiver_id, data.message_text]
            );

            // B. Broadcast the saved message ONLY to the people in this specific room
            io.to(data.room).emit('receive_message', savedMsg.rows[0]);
            
        } catch (error) {
            console.error('Socket DB Error saving message:', error.message);
        }
    });

    // 3. Handle disconnection
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Start Server (Notice we use server.listen now, not app.listen)
server.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`💬 Real-time Chat Engine is ONLINE`);
});