require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const awsRoutes = require('./routes/awsRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:4200', 
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Route Middleware - Removed custom auth routes!
app.use('/api/aws', awsRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Fortress is running on port ${PORT}`);
});