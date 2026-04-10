// backend/middleware/requireAuth.js
const { auth } = require('express-oauth2-jwt-bearer');

// 1. Verify the token against Auth0's public keys
const checkJwt = auth({
  audience: 'https://dev-rjpc2w10pgu3fftq.us.auth0.com/api/v2/',
  issuerBaseURL: `https://dev-rjpc2w10pgu3fftq.us.auth0.com/`, // Remember the trailing slash!
  tokenSigningAlg: 'RS256'
});

// 2. Custom wrapper to ensure backwards compatibility with your controllers
const requireAuth = (req, res, next) => {
    checkJwt(req, res, (err) => {
        if (err) {
            return res.status(401).json({ error: "Invalid or expired token." });
        }

        // 3. Auth0 puts the decoded token in req.auth.payload. 
        // We set req.userId to the Auth0 user sub (e.g., "auth0|123456...")
        req.userId = req.auth.payload.sub;

        // 4. Extract the raw JWT string so awsController can pass it to AWS
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            req.rawToken = req.headers.authorization.split(' ')[1];
        }

        next();
    });
};

module.exports = requireAuth;