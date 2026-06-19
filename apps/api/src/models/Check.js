import mongoose from "mongoose";

const checkSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    status: { type: String, enum: ["success", "failure"], required: true, index: true },
    latencyMs: { type: Number, min: 0 },
    statusCode: { type: Number },
    checkedAt: { type: Date, required: true, default: Date.now, index: true },
    errorMessage: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

checkSchema.index({ serviceId: 1, checkedAt: -1 });
checkSchema.index({ teamId: 1, checkedAt: -1 });

export const Check = mongoose.model("Check", checkSchema);