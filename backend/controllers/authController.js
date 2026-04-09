const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        // 1. Check if user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: "User with this email already exists." });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert into database
        const insertQuery = `
            INSERT INTO users (email, password) 
            VALUES ($1, $2) 
            RETURNING id, email, created_at
        `;
        const newUser = await db.query(insertQuery, [email, hashedPassword]);

        // Security: Never return the password (even hashed) to the frontend
        res.status(201).json({ 
            message: "User successfully registered.",
            user: newUser.rows[0] 
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Internal server error during registration." });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate Input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }
        console.log("reached here");
        // 2. Find User in Database
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = userResult.rows[0];

        // 3. Verify Password securely using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." }); // Same generic error
        }

        // 4. Create the JWT
        const token = jwt.sign(
            { id: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // 5. Send the Token in an HttpOnly Cookie
        res.cookie('token', token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 3600000  
        });

        // 6. Send Success Response (Notice we do NOT send the token here)
        res.status(200).json({
            message: "Login successful.",
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error during login." });
    }
};