import mongoose from "mongoose";

const departmentConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  categoryKey: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  primaryEmail: {
    type: String,
    required: true,
    trim: true,
  },
  ccEmails: {
    type: [String],
    default: [],
  },
  contactPerson: {
    type: String,
    default: "",
    trim: true,
  },
  defaultSubjectTemplate: {
    type: String,
    default: "KSAC Event Requirement [{category}] — {eventName} ({society}) on {dateDisplay}",
  },
  defaultHeaderNote: {
    type: String,
    default:
      "Kindly arrange the following approved requirements for the upcoming KSAC society event as detailed below:",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

departmentConfigSchema.index({ categoryKey: 1 });

export default mongoose.models.departmentConfig ||
  mongoose.model("departmentConfig", departmentConfigSchema);
