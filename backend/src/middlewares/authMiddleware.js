const jwt = require('jsonwebtoken');

// The Security Guard Function
const protect = (req, res, next) => {
    let token;

    // 1. Check if the frontend sent a token in the "Authorization" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Grab the token (It looks like "Bearer eyJhb...", so we split it to just get the token)
            token = req.headers.authorization.split(' ')[1];

            // 3. Verify the token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Attach the user's secure ID and role to the request so the next function knows who they are
            req.user = decoded;

            // 5. Let them pass to the next stage!
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token was found at all
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// We can also create a strict guard just for Doctors/Admins later
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorizeRole };