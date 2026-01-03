import mongoose from 'mongoose';

const PartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    apiKey: { type: String, required: true, unique: true, index: true },
    website: { type: String },
    evaluationCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'partners' }
);

export const Partner = mongoose.models.Partner ?? mongoose.model('Partner', PartnerSchema);
