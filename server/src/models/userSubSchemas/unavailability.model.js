import { Schema, model } from "mongoose";

const unavailabilitySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        default: "Not specified"
    }
}, { timestamps: true });

const Unavailability = model("Unavailability", unavailabilitySchema);
export default Unavailability;
