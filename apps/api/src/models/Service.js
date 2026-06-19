import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  url: { type: String, required: true, trim: true },
  checkIntervalSeconds: { type: Number, required: true, default: 60, min: 30 },
  timeoutMs: { type: Number, required: true, default: 5000, min: 1000 },
  currentStatus: { type: String, enum: ["unknown", "operational", "degraded", "down"], default: "unknown", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
},
  { timestamps: true }
);

serviceSchema.index({ teamId: 1, name: 1 }, { unique: true });

export const Service = mongoose.model("Service", serviceSchema);