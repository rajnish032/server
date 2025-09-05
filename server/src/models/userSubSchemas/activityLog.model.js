import {mongoose,model} from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, 
    timestamp: { type: Date, default: Date.now }
});

const ActivityLog = model("ActivityLog",activityLogSchema);


export default ActivityLog;
