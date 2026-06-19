import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: {type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }},
    { timestamps: true }
);

export const Team = mongoose.model('Team', teamSchema);