import mongoose from "mongoose";

const roughEventRequestSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, trim: true },
    eventDate: { type: String, required: true, trim: true },
    estimatedBudget: { type: Number, required: true, default: 0 },
    society: { type: String, required: true, trim: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    studentName: { type: String, required: true },
    studentRollNo: { type: String, default: "" },
    position: { type: String, default: "President" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["WAITING", "APPROVED", "DISAPPROVED"],
      default: "WAITING",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    reviewerName: { type: String, default: "" },
    reviewerRole: { type: String, enum: ["fic", "dean", "admin", ""] },
    reviewRemarks: { type: String, default: "" },
    reviewedAt: { type: Date },
    convertedToProposalId: { type: mongoose.Schema.Types.ObjectId, ref: "eventProposal" },
  },
  { timestamps: true }
);

roughEventRequestSchema.index({ society: 1, status: 1 });
roughEventRequestSchema.index({ status: 1, createdAt: -1 });
roughEventRequestSchema.index({ studentId: 1 });

export default mongoose.models.roughEventRequest ||
  mongoose.model("roughEventRequest", roughEventRequestSchema);
