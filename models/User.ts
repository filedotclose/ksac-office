import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "fic", "dean", "admin", "warden", "ksac", "president", "vice_president"],
    required: true,
  },
  department: { type: String }, // e.g. "School of Computer Engineering" for FIC
  hostel: {
    type: String,
    default: "KP-7A",
  },
  isSocietyLead: { type: Boolean, default: false },
  society: { type: String },
  assignedSocieties: { type: [String], default: [] }, // For FIC mentoring specific societies
  position: { type: String }, // "President" | "Vice-President" | "Faculty In-Charge" | "Dean KSAC"
  allocatedRoom: { type: String },
  societyPositions: [
    {
      _id: false,
      society: { type: String, required: true },
      position: { type: String, required: true },
      allocatedRoom: { type: String },
    },
  ],
  refreshToken: { type: String },
  tokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ society: 1 });
userSchema.index({ assignedSocieties: 1 });

if (mongoose.models.user && !mongoose.models.user.schema.path("tokenVersion")) {
  mongoose.models.user.schema.add({ tokenVersion: { type: Number, default: 0 } });
}

export default mongoose.models.user || mongoose.model("user", userSchema);
