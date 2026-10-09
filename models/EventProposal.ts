import mongoose from "mongoose";

const subEventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dayLabel: { type: String, default: "Day 1" },
    date: { type: String, default: "" },
    timings: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const budgetItemSchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    particulars: { type: String, required: true },
    quantity: { type: String, required: true },
    unitPrice: { type: String, required: true },
    totalCost: { type: Number, required: true, default: 0 },
    category: { type: String, default: "FINANCE" },
  },
  { _id: false }
);

const revenueItemSchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    source: { type: String, required: true },
    amountFormula: { type: String, required: true },
    total: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const speakerFeeItemSchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    particulars: { type: String, required: true },
    quantity: { type: String, default: "1" },
    pricing: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const venueRequirementSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    campus: { type: String, required: true },
    timings: { type: String, default: "" },
    venueType: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    details: { type: String, default: "" },
    departmentCategory: { type: String, default: "VENUE" },
  },
  { _id: false }
);

const technicalRequirementSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    timings: { type: String, default: "" },
    venue: { type: String, default: "" },
    item: { type: String, required: true },
    quantity: { type: String, default: "1" },
    details: { type: String, default: "" },
    departmentCategory: { type: String, default: "TECHNICAL" },
  },
  { _id: false }
);

const foodRequirementSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    item: { type: String, required: true },
    quantity: { type: String, default: "" },
    details: { type: String, default: "" },
    departmentCategory: { type: String, default: "FOOD" },
  },
  { _id: false }
);

const marketingRequirementSchema = new mongoose.Schema(
  {
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    item: { type: String, required: true },
    campus: { type: String, default: "" },
    details: { type: String, default: "" },
    departmentCategory: { type: String, default: "MARKETING" },
  },
  { _id: false }
);

const securityRequirementSchema = new mongoose.Schema(
  {
    date: { type: String, default: "" },
    timings: { type: String, default: "" },
    venue: { type: String, default: "" },
    guardsCount: { type: String, default: "2" },
    femaleGuardsCount: { type: String, default: "1" },
    barricadingRequired: { type: Boolean, default: false },
    crowdControlDetails: { type: String, default: "" },
    entryGateControl: { type: String, default: "Valid KIIT ID Card check" },
    nightSecurityRequired: { type: Boolean, default: false },
    details: { type: String, default: "" },
    departmentCategory: { type: String, default: "SECURITY" },
  },
  { _id: false }
);

const felicitationRequirementSchema = new mongoose.Schema(
  {
    slNo: { type: Number, default: 1 },
    particulars: { type: String, required: true }, // e.g. "Shawl", "Silver Filigree Memento", "Floral Bouquet"
    recipient: { type: String, default: "" }, // e.g. "Chief Guest", "Keynote Speaker"
    quantity: { type: String, default: "1" },
    unitPrice: { type: String, default: "0" },
    totalCost: { type: Number, default: 0 },
    departmentCategory: { type: String, default: "FOOD" },
  },
  { _id: false }
);

const sponsorItemSchema = new mongoose.Schema(
  {
    slNo: { type: Number, default: 1 },
    sponsorName: { type: String, required: true },
    category: { type: String, default: "Title Sponsor" },
    sponsorshipAmount: { type: Number, default: 0 },
    deliverables: { type: String, default: "" },
    mouSigned: { type: Boolean, default: false },
    mouFileName: { type: String, default: "" },
    mouDataUrl: { type: String, default: "" },
    mouMimeType: { type: String, default: "" },
  },
  { _id: false }
);

const signatoryBlockSchema = new mongoose.Schema(
  {
    roleTitle: { type: String, required: true },
    name: { type: String, default: "" },
    designation: { type: String, default: "" },
    location: {
      type: String,
      enum: ["NOTESHEET", "FOOTER", "BOTH"],
      default: "FOOTER",
    },
  },
  { _id: false }
);

const departmentMailLogSchema = new mongoose.Schema(
  {
    categoryKey: { type: String, required: true },
    departmentName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    ccEmails: { type: [String], default: [] },
    subject: { type: String, required: true },
    bodyText: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    fromAddress: { type: String, default: "" },
    replyToAddress: { type: String, default: "" },
    sentAt: { type: Date },
    errorNote: { type: String },
  },
  { _id: false }
);

const eventProposalSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  studentName: { type: String, required: true },
  studentRollNo: { type: String, required: true },
  society: { type: String, required: true },
  societyFullName: { type: String, default: "" },
  position: { type: String, required: true },

  // Linked Pre-proposal Rough Request
  roughRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "roughEventRequest" },

  // Notesheet & Core Event Metadata
  eventName: { type: String, required: true },
  tagline: { type: String, default: "" },
  eventMode: {
    type: String,
    enum: ["OFFLINE", "ONLINE", "HYBRID"],
    default: "OFFLINE",
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  dateDisplay: { type: String, required: true },
  submissionDate: { type: String, required: true },
  venueCampus: { type: String, default: "Campus 25" },
  ocHeadcount: { type: Number, default: 30 },
  notesheetRecipient: {
    type: String,
    default: "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU",
  },
  notesheetIntro: { type: String, default: "" },

  // Core Proposal Narrative
  background: { type: String, required: true },
  objectives: { type: [String], default: [] },
  eventFormatSummary: { type: String, default: "" },
  summary: { type: String, default: "" },

  // Enabled Sections
  enabledSections: {
    type: [String],
    default: [
      "SUB_EVENTS",
      "GUIDELINES",
      "BUDGET",
      "VENUE",
      "TECHNICAL",
      "MARKETING",
      "SECURITY",
      "FELICITATION",
      "SPONSORS",
    ],
  },

  // Dynamic Sections
  subEvents: { type: [subEventSchema], default: [] },
  guidelines: {
    participantsYear: { type: String, default: "All Years (1st to 4th Year)" },
    eligibility: { type: String, default: "Open to all KIIT students" },
    teamSize: { type: String, default: "Teams of 2 to 4 members" },
    advancementRules: { type: String, default: "" },
    extraNotes: { type: String, default: "" },
  },
  budgetItems: { type: [budgetItemSchema], default: [] },
  budgetTotal: { type: Number, default: 0 },
  budgetInWords: { type: String, default: "Rupees Zero Only" },
  includeGstNote: { type: Boolean, default: true },

  revenueItems: { type: [revenueItemSchema], default: [] },
  revenueTotal: { type: Number, default: 0 },
  revenueSummaryLine: { type: String, default: "" },

  speakerDetails: {
    name: { type: String, default: "" },
    title: { type: String, default: "" },
    bio: { type: String, default: "" },
    managerContact: { type: String, default: "" },
    feeItems: { type: [speakerFeeItemSchema], default: [] },
    speakerTotal: { type: Number, default: 0 },
  },

  // Department-mapped Requirements
  venueRequirements: { type: [venueRequirementSchema], default: [] },
  technicalRequirements: { type: [technicalRequirementSchema], default: [] },
  foodRequirements: { type: [foodRequirementSchema], default: [] },
  marketingRequirements: { type: [marketingRequirementSchema], default: [] },
  securityRequirements: { type: [securityRequirementSchema], default: [] },
  felicitationRequirements: { type: [felicitationRequirementSchema], default: [] },

  // Sponsors & MoU
  sponsors: { type: [sponsorItemSchema], default: [] },

  // Promotional Uploads & Branding
  bannerDetails: {
    format: { type: String, default: "Stage Backdrop 12x8 ft" },
    dimensions: { type: String, default: "12x8 ft" },
    material: { type: String, default: "Star Flex" },
    fileName: { type: String, default: "" },
    dataUrl: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },
  posterDetails: {
    format: { type: String, default: "A3 Physical Print" },
    fileName: { type: String, default: "" },
    dataUrl: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },
  societyLogo: {
    fileName: { type: String, default: "" },
    dataUrl: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },

  // Signatories
  signatories: { type: [signatoryBlockSchema], default: [] },

  // Multi-tier Approval Pipeline: Student -> FIC -> Dean KSAC
  status: {
    type: String,
    enum: [
      "DRAFT",
      "SUBMITTED",
      "PENDING_FIC",
      "REVISION_REQUESTED_FIC",
      "PENDING_DEAN",
      "REVISION_REQUESTED_DEAN",
      "REVISION_REQUESTED",
      "APPROVED",
      "SIGNED_SOFTCOPY_SUBMITTED",
      "COMPLETED",
      "REJECTED",
    ],
    default: "PENDING_FIC",
  },

  // FIC Approval Details
  ficApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    ficName: { type: String, default: "" },
    approvedAt: { type: Date },
    remarks: { type: String, default: "" },
    status: { type: String, default: "PENDING" },
  },

  // Dean KSAC Approval Details
  deanApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    deanName: { type: String, default: "" },
    approvedAt: { type: Date },
    remarks: { type: String, default: "" },
  },

  deanNote: { type: String, default: "" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  approvedAt: { type: Date },

  // Department Email Logs
  departmentMails: { type: [departmentMailLogSchema], default: [] },

  // Final Scanned Hardcopy
  signedSoftcopy: {
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    dataUrl: { type: String, default: "" },
    uploadedAt: { type: Date },
    uploadedByName: { type: String, default: "" },
    verifiedByDean: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

eventProposalSchema.index({ studentId: 1, createdAt: -1 });
eventProposalSchema.index({ society: 1, status: 1 });
eventProposalSchema.index({ status: 1, createdAt: -1 });
eventProposalSchema.index({ roughRequestId: 1 });

export default mongoose.models.eventProposal ||
  mongoose.model("eventProposal", eventProposalSchema);
