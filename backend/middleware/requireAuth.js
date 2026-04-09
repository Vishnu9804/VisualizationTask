// backend/middleware/requireAuth.js
const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    // 1. Get the token from the secure HttpOnly cookie
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Access Denied. Please log in." });
    }

    try {
        // 2. Verify the token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach the user ID to the request so the next function can use it
        req.userId = verified.id;
        next(); 
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

module.exports = requireAuth;