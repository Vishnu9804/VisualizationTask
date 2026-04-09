// backend/routes/awsRoutes.js
const express = require('express');
const router = express.Router();
const awsController = require('../controllers/awsController');
const requireAuth = require('../middleware/requireAuth'); // The security checkpoint

// Apply requireAuth middleware to ALL routes in this file
router.use(requireAuth); 

// GET /api/aws/setup - Gives frontend the ExternalId & App ID
router.get('/setup', awsController.getAwsSetupInfo);

// POST /api/aws/role - Saves the Role ARN to the database
router.post('/role', awsController.saveRoleArn);

// GET /api/aws/infrastructure - Does the AssumeRole magic and fetches EC2s
router.get('/infrastructure', awsController.fetchAwsInfrastructure);

module.exports = router;