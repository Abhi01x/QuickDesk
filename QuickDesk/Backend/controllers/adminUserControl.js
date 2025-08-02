import userModel from '../models/userModel.js';


const adminUserControl = {
  // Get all users list and count (admin only)
  getAllUsers: async (req, res) => {
    try {

    //   const admin = await userModel.findById(userId);
    //   if (!admin || admin.role !== 'admin') {
    //     return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    //   }

      const users = await userModel.find({}, '-password'); // hide passwords
      const count = users.length;

      res.json({
        success: true,
        message: "User list fetched successfully",
        count,
        users
      });

    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  },

  // Change user role (admin only)
  changeUserRole: async (req, res) => {
    try {
      const {  targetUserId, newRole } = req.body;

      if (!targetUserId || !newRole) {
        return res.json({ success: false, message: "adminId, targetUserId and newRole are required" });
      }

    //   const admin = await userModel.findById(adminId);
    //   if (!admin || admin.role !== 'admin') {
    //     return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    //   }

      if (!['user', 'support'].includes(newRole)) {
        return res.json({ success: false, message: "Invalid role. Only 'user' or 'support' allowed" });
      }

      const updatedUser = await userModel.findByIdAndUpdate(
        targetUserId,
        { role: newRole },
        { new: true }
      );

      if (!updatedUser) {
        return res.json({ success: false, message: "Target user not found" });
      }

      res.json({
        success: true,
        message: `Role updated to ${newRole}`,
        data: updatedUser
      });

    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  }
};

export default adminUserControl;
