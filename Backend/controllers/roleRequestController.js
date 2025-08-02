import userModel from '../models/userModel.js';
import roleRequestModel from '../models/roleRequestModel.js';

const roleRequestController = {
  

//user apply to upgrede

  applyForSupport: async (req, res) => {
    try {
      const { userId, reason } = req.body;

      if (!userId || !reason) {
        return res.json({ success: false, message: "userId and reason are required" });
      }

      const user = await userModel.findById(userId);
      if (!user) return res.json({ success: false, message: "User not found" });

      if (user.role !== 'user') {
        return res.json({ success: false, message: "Only users can apply for support role" });
      }

      // Check if already requested
      const existingRequest = await roleRequestModel.findOne({ userId, status: 'pending' });
      if (existingRequest) {
        return res.json({ success: false, message: "You already have a pending request" });
      }

      const request = new roleRequestModel({ userId, reason });
      await request.save();

      res.json({ success: true, message: "Role upgrade request submitted" });
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  },

// check user its status
checkRequestStatus : async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const request = await roleRequestModel.findOne({ userId }).sort({ date: -1 });

    if (!request) {
      return res.json({ success: false, message: "No request found for this user" });
    }

    res.json({
      success: true,
      message: "Request status fetched successfully",
      data: {
        status: request.status,
        reason: request.reason,
        date: request.date
      }
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
},










  //  Admin views all role upgrade requests


  getAllRequests: async (req, res) => {
    try {
    //   const { adminId } = req.body;

    //   const admin = await userModel.findById(adminId);
    //   if (!admin || admin.role !== 'admin') {
    //     return res.status(403).json({ success: false, message: "Access denied" });
    //   }

      const requests = await roleRequestModel.find().sort({ date: -1 });
      res.json({ success: true, data: requests });

    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  },

  //  Admin approves/rejects a request
  respondToRequest: async (req, res) => {
    try {
      const {  requestId, action } = req.body;

      if ( !requestId || !action) {
        return res.json({ success: false, message: " requestId, and action are required" });
      }

    //   const admin = await userModel.findById(adminId)/
    //   if (!admin || admin.role !== 'admin') {
    //     return res.status(403).json({ success: false, message: "Access denied" });
    //   }

    
      const request = await roleRequestModel.findById(requestId);
      if (!request || request.status !== 'pending') {
        return res.json({ success: false, message: "Request not found or already processed" });
      }

      if (action === 'approve') {
        await userModel.findByIdAndUpdate(request.userId, { role: 'support' });
        request.status = 'approved';
        await request.save();
        return res.json({ success: true, message: "User promoted to support", data: request });
      } else if (action === 'reject') {
        request.status = 'rejected';
        await request.save();
        return res.json({ success: true, message: "Request rejected", data: request });
      } else {
        return res.json({ success: false, message: "Invalid action" });
      }

    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  },


  

};

export default roleRequestController;
