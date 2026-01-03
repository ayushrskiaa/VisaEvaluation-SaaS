import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { Partner } from '../models/Partner.model.js';
import { Evaluation } from '../models/Evaluation.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const partnerRouter = express.Router();

const createPartnerSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    website: z.string().url().optional(),
  })
  .strict();

function mongoIsReady() {
  return mongoose.connection.readyState === 1;
}

/**
 * Generate a random API key for partners
 */
function generateApiKey() {
  return `pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Authenticate partner by API key
 */
export async function authenticatePartner(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return null;
  }
  
  if (!mongoIsReady()) {
    return null; // Partner auth only works with MongoDB
  }

  try {
    return await Partner.findOne({ apiKey });
  } catch {
    return null;
  }
}

/**
 * POST /api/partners - Create a new partner (admin only)
 */
partnerRouter.post('/partners', asyncHandler(async (req, res) => {
  if (!mongoIsReady()) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB is not connected',
    });
  }

  const parsed = createPartnerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { name, email, website } = parsed.data;

  // Check if partner already exists
  const existing = await Partner.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Partner with this email already exists' });
  }

  const apiKey = generateApiKey();
  const partner = await Partner.create({
    name,
    email,
    website,
    apiKey,
  });

  return res.status(201).json({
    success: true,
    data: {
      id: partner._id.toString(),
      name: partner.name,
      email: partner.email,
      apiKey: partner.apiKey,
      website: partner.website,
      embedUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/embed?apiKey=${partner.apiKey}`,
    },
  });
}));

/**
 * GET /api/partners/me - Get partner details (requires x-api-key header)
 */
partnerRouter.get('/partners/me', asyncHandler(async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const partner = await authenticatePartner(apiKey);

  if (!partner) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
  }

  return res.json({
    success: true,
    data: {
      id: partner._id.toString(),
      name: partner.name,
      email: partner.email,
      website: partner.website,
      evaluationCount: partner.evaluationCount,
      embedUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/embed?apiKey=${partner.apiKey}`,
    },
  });
}));

/**
 * GET /api/partners/evaluations - List partner's evaluations
 */
partnerRouter.get('/partners/evaluations', asyncHandler(async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const partner = await authenticatePartner(apiKey);

  if (!partner) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
  }

  // For now, return evaluations with matching partner email
  const evaluations = await Evaluation.find({ partnerEmail: partner.email }).lean();

  return res.json({
    success: true,
    data: evaluations.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      email: e.email,
      visaTypeId: e.visaTypeId,
      score: e.score,
      createdAt: e.createdAt,
    })),
  });
}));

/**
 * GET /api/partners/stats - Get partner statistics
 */
partnerRouter.get('/partners/stats', asyncHandler(async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const partner = await authenticatePartner(apiKey);

  if (!partner) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
  }

  const evaluations = await Evaluation.find({ partnerEmail: partner.email }).lean();
  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
    : 0;

  return res.json({
    success: true,
    data: {
      totalEvaluations: evaluations.length,
      averageScore: avgScore,
      byCountry: evaluations.reduce((acc, e) => {
        acc[e.countryCode] = (acc[e.countryCode] || 0) + 1;
        return acc;
      }, {}),
    },
  });
}));
