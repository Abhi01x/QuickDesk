import express from 'express';
import roleRequestController from '../controllers/roleRequestController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminauth.js';

const requestrouter = express.Router();

// User routes
requestrouter.post('/apply', authUser,  roleRequestController.applyForSupport);
requestrouter.post('/apply-status', authUser,  roleRequestController.checkRequestStatus);

// Admin routes

requestrouter.post('/requests', adminAuth, roleRequestController.getAllRequests);
requestrouter.post('/respond', adminAuth, roleRequestController.respondToRequest);

export default requestrouter;
