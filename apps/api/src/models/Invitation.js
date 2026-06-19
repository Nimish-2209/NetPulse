import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["admin", "maintainer", "viewer"], required: true, default: "viewer" },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date },
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ teamId: 1, email: 1, acceptedAt: 1 });

export const Invitation = mongoose.model("Invitation", invitationSchema);
