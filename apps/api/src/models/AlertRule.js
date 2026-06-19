import mongoose from "mongoose";

const alertRuleSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    failureThreshold: { type: Number, required: true, default: 3, min: 1 },
    latencyThresholdMs: { type: Number, required: true, default: 1000, min: 100 },
    enabled: { type: Boolean, required: true, default: true }
  },
  {
    timestamps: true
  }
);

alertRuleSchema.index({ teamId: 1, serviceId: 1 }, { unique: true });

export const AlertRule = mongoose.model("AlertRule", alertRuleSchema);