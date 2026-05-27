const db = require('../config/db');

// @desc    Get chat history between the logged-in user and another user
// @route   GET /api/messages/:otherUserId
const getChatHistory = async (req, res) => {
    try {
        const myId = req.user.id; 
        const otherUserId = req.params.otherUserId;

        // Fetch all messages where I am the sender and they are the receiver, OR vice versa
        const messages = await db.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [myId, otherUserId]
        );

        res.status(200).json(messages.rows);
    } catch (error) {
        console.error('Error fetching chat history:', error.message);
        res.status(500).json({ message: 'Server Error fetching messages.' });
    }
};

module.exports = { getChatHistory };