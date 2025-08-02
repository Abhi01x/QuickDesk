import express from 'express';
import adminUserControl from '../controllers/adminUserControl.js';
import adminAuth from '../middleware/adminauth.js';

const adminrouter = express.Router();

// Admin only routes
adminrouter.post('/get-users', adminAuth, adminUserControl.getAllUsers);
adminrouter.post('/change-role', adminAuth, adminUserControl.changeUserRole);

export default adminrouter;
