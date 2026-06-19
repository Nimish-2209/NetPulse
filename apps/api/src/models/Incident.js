import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000 },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true, default: "medium", index: true },
    status: { type: String, enum: ["open", "acknowledged", "resolved"], required: true, default: "open", index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    openedAt: { type: Date, required: true, default: Date.now },
    resolvedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

incidentSchema.index({ teamId: 1, status: 1 });
incidentSchema.index({ serviceId: 1, openedAt: -1 });

export const Incident = mongoose.model("Incident", incidentSchema);