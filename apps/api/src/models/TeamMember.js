import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    role: { type: String, enum: ['admin', 'maintainer','viewer'], required: true, default: 'viewer' }}, 
    { timestamps: true }
);

teamMemberSchema.index({ userId: 1, teamId: 1 }, { unique: true });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);