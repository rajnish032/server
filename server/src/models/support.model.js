import { Schema, model } from "mongoose";

const supportTicketSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["bug-report", "feedback", "feature-request", "question"],
      required: true,
    },
    comment: { type: String, required: true },
    image: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

const Support = model("Support", supportTicketSchema);
export default Support;
