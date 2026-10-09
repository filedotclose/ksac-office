import mongoose from "mongoose";

const eventBudgetSchema = new mongoose.Schema(
  {
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: "eventProposal", unique: true, sparse: true },
    eventName: { type: String, required: true, trim: true },
    society: { type: String, required: true, trim: true },
    academicYear: { type: String, default: "2025-2026" },
    budgetTotal: { type: Number, required: true, default: 0 },
    budgetInWords: { type: String, default: "" },
    revenueTotal: { type: Number, default: 0 },
    status: { type: String, default: "DRAFT" },
    itemsCount: { type: Number, default: 0 },
    categoryBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

eventBudgetSchema.index({ eventName: 1 });
eventBudgetSchema.index({ society: 1 });
eventBudgetSchema.index({ budgetTotal: -1 });

export default mongoose.models.eventBudget ||
  mongoose.model("eventBudget", eventBudgetSchema);
