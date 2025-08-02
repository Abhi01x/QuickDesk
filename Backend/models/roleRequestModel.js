import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  date: { type: Number, default: Date.now }
});

const roleRequestModel = mongoose.models.roleRequests || mongoose.model('roleRequests', roleRequestSchema);

export default roleRequestModel;
