import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  passId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "pass",
    required: false,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "attendanceSession",
    required: false,
  },
  rollNo: {
    type: String,
  },
  clientIp: {
    type: String,
  },
  sequenceDelta: {
    type: Number,
  },
  deviceId: {
    type: String,
  },
  reason: {
    type: String,
  },
  activityType: {
    type: String,
    enum: [
      "HOSTEL_EXIT",
      "KSAC_ENTRY",
      "KSAC_EXIT",
      "HOSTEL_ENTRY",
      "KSAC_VERIFIED",
      "PASS_APPROVED",
      "PASS_REQUESTED",
      "ADMIN_OVERRIDE",
      "QR_SCAN_REJECTED",
      "DUPLICATE_DEVICE_ATTEMPT",
      "GEOFENCE_VIOLATION",
      "ATTENDANCE_ANOMALY",
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    required: true,
  },
});

// Index for performance when querying logs by student or anomaly type
activityLogSchema.index({ studentId: 1, timestamp: -1 });
activityLogSchema.index({ activityType: 1, timestamp: -1 });

if (mongoose.models.activityLog && !mongoose.models.activityLog.schema.path("sequenceDelta")) {
  delete mongoose.models.activityLog;
}

export default mongoose.models.activityLog || mongoose.model("activityLog", activityLogSchema);
