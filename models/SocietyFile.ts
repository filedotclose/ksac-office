import mongoose from "mongoose";

const societyFileSchema = new mongoose.Schema(
  {
    society: { type: String, required: true, trim: true, index: true },
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: "eventProposal" },
    eventName: { type: String, default: "", trim: true },
    fileType: {
      type: String,
      enum: ["BANNER", "POSTER", "MOU", "SIGNED_COPY", "SOCIETY_LOGO", "OTHER"],
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    fileSize: { type: Number, default: 0 },
    fileDimensions: { type: String, default: "" }, // e.g. "12x8 ft (Backdrop)" or "1080x1350 px"
    dataUrl: { type: String, required: true }, // Base64 payload
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    uploadedByName: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

societyFileSchema.index({ society: 1, fileType: 1, createdAt: -1 });
societyFileSchema.index({ proposalId: 1 });

export default mongoose.models.societyFile ||
  mongoose.model("societyFile", societyFileSchema);
