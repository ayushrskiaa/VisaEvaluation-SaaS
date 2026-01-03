/**
 * Visa Evaluation Engine - Gemini AI Powered
 * 
 * Analyzes visa applications using Google Gemini AI to provide:
 * - AI-generated evaluation score
 * - Personalized summary
 * - Actionable suggestions
 * 
 * No rule-based fallback - requires Gemini API key.
 */

import { generateAIEvaluation } from './ai.service.js';

function unique(list) {
  return Array.from(new Set(list));
}

/**
 * AI-powered visa evaluation using Gemini
 * 
 * @param {Object} params
 * @param {Object} params.visa - Visa type configuration
 * @param {Array} params.documents - Uploaded documents
 * @param {string} params.applicantName - Applicant's name for personalization
 * @returns {Promise<Object>} AI-generated evaluation results
 * @throws {AIEvaluationError} If Gemini API is unavailable or fails
 */
export async function evaluateSubmissionWithAI({ visa, documents, applicantName }) {
  const required = Array.isArray(visa?.requiredDocuments) ? visa.requiredDocuments : [];
  const uploadedTypes = unique(
    (Array.isArray(documents) ? documents : [])
      .map((d) => d?.documentType)
      .filter((t) => typeof t === 'string' && t.length > 0)
  );

  const missingDocuments = required.filter((doc) => !uploadedTypes.includes(doc));

  // Let Gemini AI analyze the entire application and generate score, summary, and suggestions
  const aiResult = await generateAIEvaluation({
    visa,
    documents,
    missingDocuments,
    applicantName,
  });

  // Apply configurable maximum score cap from environment variable (default 85%)
  const maxScoreCap = parseInt(process.env.MAX_SCORE_CAP || '85', 10);
  const cappedScore = Math.min(aiResult.score, maxScoreCap);

  console.log(`📊 Score Calculation: AI=${aiResult.score}, Cap=${maxScoreCap}, Final=${cappedScore}`);

  return {
    rawScore: aiResult.score,        // Original AI score (uncapped)
    score: cappedScore,               // Capped score shown to user
    scoreCap: maxScoreCap,            // Maximum allowed score
    missingDocuments,
    summary: aiResult.summary,
    suggestions: aiResult.suggestions,
  };
}
