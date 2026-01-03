

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { catalogRouter } from './routes/catalog.route.js';
import { evaluationRouter } from './routes/evaluation.route.js';
import { uploadRouter } from './routes/upload.route.js';
import { AIEvaluationError } from './services/ai.service.js';

export function createApp() {
  // Ensure env is loaded for ALL entry points (server, scripts, tests)
  dotenv.config();

  const app = express();

  // Enable CORS for frontend (http://localhost:5173)
  app.use(cors());
  
  // Parse JSON request bodies (max 2MB)
  app.use(express.json({ limit: '2mb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // API status endpoint
  app.get('/api', (_req, res) => {
    res.json({ name: 'visa-eval-api', status: 'ok' });
  });

  // Register API routes
  app.use('/api', catalogRouter);      // Countries and visa types
  app.use('/api', evaluationRouter);   // Create and retrieve evaluations
  app.use('/api', uploadRouter);       // Document uploads

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof AIEvaluationError) {
      // Expected operational error (e.g., Gemini quota/rate limit). Avoid dumping full cause/stack.
      // eslint-disable-next-line no-console
      console.warn(`[AI] ${err.code ?? 'AI_EVALUATION_FAILED'} (${err.statusCode ?? 503}): ${err.message}`);

      res.setHeader('Retry-After', '30');
      return res.status(err.statusCode ?? 503).json({
        success: false,
        error: err.message,
        code: err.code ?? 'AI_EVALUATION_FAILED',
        retryable: err.retryable ?? true,
      });
    }

    // eslint-disable-next-line no-console
    console.error(err);

    const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const message = typeof err?.message === 'string' ? err.message : 'Internal server error';
    return res.status(statusCode).json({ success: false, error: message });
  });

  return app;
}
