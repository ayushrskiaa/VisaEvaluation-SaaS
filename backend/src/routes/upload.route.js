import crypto from 'node:crypto';
import path from 'node:path';

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { z } from 'zod';

import { getVisaTypeById } from '../data/visaCatalog.data.js';
import { Evaluation } from '../models/Evaluation.model.js';
import { evaluateSubmissionWithAI } from '../services/evaluationEngine.service.js';
import { fileStoreGetEvaluation, fileStoreUpdateEvaluation } from '../storage/evaluationFileStore.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadRouter = express.Router();

const maxBytes = 5 * 1024 * 1024; // 5MB per file

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 12);
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    return cb(null, true);
  },
});

function uploadSingleFile(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      err.statusCode = 400;
      return next(err);
    }
    return next();
  });
}

const documentMetaSchema = z
  .object({
    documentType: z.string().min(2).max(64),
  })
  .strict();

function mongoIsReady() {
  return mongoose.connection.readyState === 1;
}

function isValidEvaluationId(id) {
  if (typeof id !== 'string' || id.length === 0) return false;
  return mongoose.isValidObjectId(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

uploadRouter.post('/evaluations/:id/documents', uploadSingleFile, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const parsed = documentMetaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Missing file (field name must be "file")' });
  }

  const { documentType } = parsed.data;

  if (!isValidEvaluationId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid evaluation id' });
  }

  const evaluation = mongoIsReady() ? await Evaluation.findById(id) : await fileStoreGetEvaluation(id);
  if (!evaluation) return res.status(404).json({ success: false, error: 'Evaluation not found' });

  const visa = getVisaTypeById(evaluation.visaTypeId);
  if (!visa) return res.status(400).json({ success: false, error: 'Evaluation has unknown visaTypeId' });

  if (!visa.requiredDocuments.includes(documentType)) {
    return res.status(400).json({
      success: false,
      error: `documentType must be one of: ${visa.requiredDocuments.join(', ')}`,
    });
  }

  const docRecord = {
    documentType,
    originalName: req.file.originalname,
    storagePath: path.relative(process.cwd(), req.file.path).replaceAll('\\', '/'),
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    uploadedAt: new Date(),
  };

  // Replace existing doc of same type if present
  const nextDocs = (evaluation.documents ?? []).filter((d) => d.documentType !== documentType);
  nextDocs.push(docRecord);

  // Auto-evaluate after each upload using AI
  const result = await evaluateSubmissionWithAI({ 
    visa, 
    documents: nextDocs,
    applicantName: evaluation.name 
  });

  if (mongoIsReady()) {
    evaluation.documents = nextDocs;
    evaluation.rawScore = result.rawScore;
    evaluation.score = result.score;
    evaluation.scoreCap = result.scoreCap;
    evaluation.summary = result.summary;
    evaluation.suggestions = result.suggestions;
    await evaluation.save();
  } else {
    await fileStoreUpdateEvaluation(id, {
      documents: nextDocs,
      rawScore: result.rawScore,
      score: result.score,
      scoreCap: result.scoreCap,
      summary: result.summary,
      suggestions: result.suggestions,
    });
  }

  return res.status(201).json({
    success: true,
    data: {
      id: mongoIsReady() ? evaluation._id.toString() : evaluation.id,
      documents: nextDocs,
      score: result.score,
      rawScore: result.rawScore,
      scoreCap: result.scoreCap,
      summary: result.summary,
      suggestions: result.suggestions,
      missingDocuments: result.missingDocuments,
    },
  });
}));
