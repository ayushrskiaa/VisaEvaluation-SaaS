import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { getVisaTypeById } from '../data/visaCatalog.data.js';
import { Evaluation } from '../models/Evaluation.model.js';
import { evaluateSubmissionWithAI } from '../services/evaluationEngine.service.js';
import { fileStoreCreateEvaluation, fileStoreGetEvaluation, fileStoreUpdateEvaluation } from '../storage/evaluationFileStore.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const evaluationRouter = express.Router();

const createEvaluationSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(254),
    countryCode: z.string().min(2).max(4),
    visaTypeId: z.string().min(3).max(64),
  })
  .strict();

function mongoIsReady() {
  // 1 = connected
  return mongoose.connection.readyState === 1;
}

function isValidEvaluationId(id) {
  if (typeof id !== 'string' || id.length === 0) return false;
  // Accept either MongoDB ObjectId or UUID/file-store id
  return mongoose.isValidObjectId(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function getScoreCap() {
  const cap = Number(process.env.MAX_SCORE_CAP ?? 85);
  if (Number.isFinite(cap) && cap >= 0 && cap <= 100) return cap;
  return 85;
}

evaluationRouter.post('/evaluations', asyncHandler(async (req, res) => {
  const parsed = createEvaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { name, email, countryCode, visaTypeId } = parsed.data;
  const visa = getVisaTypeById(visaTypeId);
  if (!visa) return res.status(404).json({ success: false, error: 'Visa type not found' });
  if (visa.countryCode !== countryCode) {
    return res.status(400).json({ success: false, error: 'visaTypeId does not match countryCode' });
  }

  // Initial evaluation with no documents - calculate missing documents
  const missingDocuments = visa.requiredDocuments || [];
  
  const evaluationDraft = {
    name,
    email,
    countryCode,
    visaTypeId,
    documents: [],
    rawScore: 0,
    score: 0,
    scoreCap: 100,
    summary: 'Evaluation created. Please upload required documents to receive your AI-powered evaluation.',
    suggestions: [`Upload required documents: ${missingDocuments.join(', ')}`],
    createdAt: new Date(),
  };

  const created = mongoIsReady()
    ? await Evaluation.create(evaluationDraft)
    : await fileStoreCreateEvaluation(evaluationDraft);

  return res.status(201).json({
    success: true,
    data: {
      id: mongoIsReady() ? created._id.toString() : created.id,
      score: created.score,
      scoreCap: created.scoreCap,
      rawScore: created.rawScore ?? created.score,
      summary: created.summary,
      suggestions: created.suggestions,
      missingDocuments: missingDocuments,
    },
  });
}));

evaluationRouter.post('/evaluations/:id/evaluate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidEvaluationId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid evaluation id' });
  }

  const evaluation = mongoIsReady() ? await Evaluation.findById(id) : await fileStoreGetEvaluation(id);
  if (!evaluation) return res.status(404).json({ success: false, error: 'Evaluation not found' });

  const visa = getVisaTypeById(evaluation.visaTypeId);
  if (!visa) return res.status(400).json({ success: false, error: 'Evaluation has unknown visaTypeId' });

  // Use AI evaluation if available
  const result = await evaluateSubmissionWithAI({ 
    visa, 
    documents: evaluation.documents,
    applicantName: evaluation.name 
  });

  if (mongoIsReady()) {
    evaluation.rawScore = result.rawScore;
    evaluation.score = result.score;
    evaluation.scoreCap = result.scoreCap;
    evaluation.summary = result.summary;
    evaluation.suggestions = result.suggestions;
    await evaluation.save();
  } else {
    await fileStoreUpdateEvaluation(id, {
      rawScore: result.rawScore,
      score: result.score,
      scoreCap: result.scoreCap,
      summary: result.summary,
      suggestions: result.suggestions,
      documents: evaluation.documents,
      name: evaluation.name,
      email: evaluation.email,
      countryCode: evaluation.countryCode,
      visaTypeId: evaluation.visaTypeId,
    });
  }

  return res.json({
    success: true,
    data: {
      id: mongoIsReady() ? evaluation._id.toString() : evaluation.id,
      score: result.score,
      rawScore: result.rawScore,
      scoreCap: result.scoreCap,
      summary: result.summary,
      suggestions: result.suggestions,
      missingDocuments: result.missingDocuments,
    },
  });
}));

evaluationRouter.get('/evaluations/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidEvaluationId(id)) {
    return res.status(400).json({ success: false, error: 'Invalid evaluation id' });
  }

  if (mongoIsReady()) {
    const found = await Evaluation.findById(id).lean();
    if (!found) return res.status(404).json({ success: false, error: 'Evaluation not found' });
    return res.json({ success: true, data: { ...found, id: found._id.toString() } });
  }

  const found = await fileStoreGetEvaluation(id);
  if (!found) return res.status(404).json({ success: false, error: 'Evaluation not found' });
  return res.json({ success: true, data: found });
}));
