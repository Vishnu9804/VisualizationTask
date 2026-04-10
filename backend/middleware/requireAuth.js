// backend/middleware/requireAuth.js
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  // USE THE CUSTOM API IDENTIFIER HERE
  audience: 'https://fortress-api',
  issuerBaseURL: `https://dev-rjpc2w10pgu3fftq.us.auth0.com/`, 
  tokenSigningAlg: 'RS256'
});

const requireAuth = (req, res, next) => {
    checkJwt(req, res, (err) => {
        if (err) {
            console.error("Auth0 Token Error:", err);
            return res.status(401).json({ error: "Invalid or expired token." });
        }

        req.userId = req.auth.payload.sub;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            req.rawToken = req.headers.authorization.split(' ')[1];
        }

        next();
    });
};

module.exports = requireAuth;