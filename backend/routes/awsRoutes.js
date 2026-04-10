// backend/routes/awsRoutes.js
const express = require('express');
const router = express.Router();
const awsController = require('../controllers/awsController');
const requireAuth = require('../middleware/requireAuth'); 

router.use(requireAuth); 

// NEW: Endpoint to check if user already provided their ARN
router.get('/check-connection', awsController.checkConnection);

router.get('/setup', awsController.getAwsSetupInfo);
router.post('/role', awsController.saveRoleArn);
router.get('/infrastructure', awsController.fetchAwsInfrastructure);

module.exports = router;