import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    documentType: { type: String, required: true },
    originalName: { type: String, required: true },
    storagePath: { type: String }, // Legacy field for filesystem storage (optional)
    fileContent: { type: Buffer }, // Store actual file content in MongoDB
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EvaluationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },

    countryCode: { type: String, required: true },
    visaTypeId: { type: String, required: true },

    documents: { type: [DocumentSchema], default: [] },

    rawScore: { type: Number, default: 0 },
    score: { type: Number, required: true },
    scoreCap: { type: Number, required: true },

    summary: { type: String, required: true },
    suggestions: { type: [String], default: [] },

    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'evaluations' }
);

export const Evaluation = mongoose.models.Evaluation ?? mongoose.model('Evaluation', EvaluationSchema);
