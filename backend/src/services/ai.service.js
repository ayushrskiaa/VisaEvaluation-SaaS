import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import path from 'node:path';

// Load environment variables
dotenv.config();

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

// Initialize Gemini client
const geminiClient = getGeminiApiKey() ? new GoogleGenerativeAI(getGeminiApiKey()) : null;

// Track if we've already warned about AI being unavailable
let aiWarningShown = false;

export class AIEvaluationError extends Error {
  /**
   * @param {string} message
   * @param {{ statusCode?: number, code?: string, retryable?: boolean, cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'AIEvaluationError';
    this.statusCode = options.statusCode ?? 503;
    this.code = options.code ?? 'AI_EVALUATION_FAILED';
    this.retryable = options.retryable ?? true;
    this.cause = options.cause;
  }
}

function getUpstreamStatus(err) {
  return (
    err?.status ||
    err?.response?.status ||
    err?.error?.status ||
    err?.cause?.status ||
    err?.statusCode ||
    undefined
  );
}

function mapGeminiError(err) {
  const status = getUpstreamStatus(err);
  const message = typeof err?.message === 'string' ? err.message : 'Gemini request failed';

  // Some SDK/transport errors only include status in the message
  const messageHas429 = typeof message === 'string' && /\b429\b/.test(message);
  const messageHas401 = typeof message === 'string' && /\b401\b/.test(message);
  const messageHas403 = typeof message === 'string' && /\b403\b/.test(message);
  const messageHas404 = typeof message === 'string' && /\b404\b/.test(message);
  const messageHasModelNotFound =
    typeof message === 'string' &&
    /models\/[\w.-]+ is not found/i.test(message);

  // Treat 401/403 as configuration/auth issues (non-retryable without changing key)
  if (status === 401 || status === 403 || messageHas401 || messageHas403) {
    return {
      statusCode: 502,
      code: 'GEMINI_AUTH_FAILED',
      retryable: false,
      message: 'AI evaluation is unavailable due to an invalid/unauthorized Gemini API key.',
    };
  }

  // Model not found / unsupported for generateContent
  if (status === 404 || messageHas404 || messageHasModelNotFound) {
    return {
      statusCode: 502,
      code: 'GEMINI_MODEL_NOT_FOUND',
      retryable: false,
      message:
        'AI evaluation is unavailable because the configured Gemini model name is not available for this API key/project. Set GEMINI_MODEL in the backend .env to a supported model.',
    };
  }

  // 429 can be quota exceeded or rate limited
  if (status === 429 || messageHas429) {
    return {
      statusCode: 503,
      code: 'GEMINI_QUOTA_OR_RATE_LIMIT',
      retryable: true,
      message:
        'AI evaluation is temporarily unavailable (Gemini quota/rate limit). Please retry later or use an API key with available quota.',
    };
  }

  // Other upstream errors
  if (typeof status === 'number') {
    return {
      statusCode: 502,
      code: 'GEMINI_UPSTREAM_ERROR',
      retryable: true,
      message: `AI evaluation failed due to an upstream error (status ${status}). Please retry later.`,
    };
  }

  // Unknown/transport errors
  return {
    statusCode: 503,
    code: 'GEMINI_REQUEST_FAILED',
    retryable: true,
    message: `AI evaluation failed: ${message}`,
  };
}

function extractJsonObject(text) {
  if (typeof text !== 'string') return null;
  
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // If direct parse fails, try to extract JSON object from text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Generate AI-powered evaluation with score, summary and suggestions using Gemini
 * @param {Object} params - Evaluation parameters
 * @param {Object} params.visa - Visa type details
 * @param {Array} params.documents - Uploaded documents with storagePath
 * @param {Array} params.missingDocuments - Missing document types
 * @param {string} params.applicantName - Applicant's name
 * @returns {Promise<{score: number, summary: string, suggestions: string[]}>}
 */
export async function generateAIEvaluation({
  visa,
  documents,
  missingDocuments,
  applicantName = 'the applicant',
}) {
  if (!geminiClient) {
    throw new AIEvaluationError(
      'GEMINI_API_KEY not configured. AI evaluation requires a Gemini API key in the backend .env file.',
      {
        statusCode: 503,
        code: 'GEMINI_NOT_CONFIGURED',
        retryable: false,
      }
    );
  }

  try {
    const requiredDocs = visa.requiredDocuments.join(', ');
    const missing = missingDocuments.join(', ') || 'None';

    // Read file content for PDF documents
    const fileContents = [];
    for (const doc of documents) {
      try {
        const filePath = path.join(process.cwd(), doc.storagePath);
        console.log(`📖 Reading file for analysis: ${doc.originalName}`);
        
        // For PDFs, read as base64
        const fileBuffer = await fs.readFile(filePath);
        const base64Data = fileBuffer.toString('base64');
        
        fileContents.push({
          inlineData: {
            mimeType: doc.mimeType,
            data: base64Data,
          },
          name: doc.originalName,
          type: doc.documentType,
        });
        
        console.log(`✅ File loaded: ${doc.originalName} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
      } catch (readErr) {
        console.error(`❌ Failed to read ${doc.originalName}:`, readErr.message);
      }
    }

    // Build prompt
    let prompt = `You are an expert visa evaluation assistant. Analyze the uploaded documents and provide a comprehensive evaluation:

Applicant: ${applicantName}
Visa Type: ${visa.name} (${visa.code})
Country: ${visa.country}
Description: ${visa.description}

Required Documents: ${requiredDocs}
Missing Documents: ${missing}
Document Completeness: ${documents.length}/${visa.requiredDocuments.length} documents uploaded

`;

    if (fileContents.length > 0) {
      prompt += `\n📄 Documents Provided for Analysis:\n`;
      fileContents.forEach(file => {
        prompt += `- ${file.name} (${file.type})\n`;
      });
      prompt += `\nPlease carefully review the content of these documents. Analyze the qualifications, experience, skills, and achievements to assess visa eligibility.`;
    }

    prompt += `

Analyze the application and provide:
1. Score (0-100): Based on document completeness, content quality, and visa alignment
2. Summary: ONE clear, concise sentence (max 100 words) explaining the evaluation
3. Suggestions: 2-3 specific, actionable improvements

Format as JSON:
{
  "score": 75,
  "summary": "Clear one-sentence evaluation",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Scoring: 0-40 incomplete, 41-60 gaps, 61-80 good, 81-95 strong, 96-100 exceptional.
Be concise, professional, and constructive.`;

    const model = geminiClient.getGenerativeModel({
      model: getGeminiModelName(),
      systemInstruction: 'You are a helpful visa evaluation assistant with expertise in immigration requirements. Always respond with valid JSON only.',
    });

    // Build content parts including file data
    const parts = [{ text: prompt }];
    fileContents.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.inlineData.mimeType,
          data: file.inlineData.data,
        }
      });
    });

    console.log(`🤖 Sending ${fileContents.length} document(s) to Gemini for analysis...`);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const text = result?.response?.text?.() ?? '';
    
    // Log AI response to terminal FIRST
    console.log('\n🤖 ===== GEMINI AI RESPONSE =====');
    console.log(`Raw Response (${text.length} chars):`);
    console.log(text);
    console.log('\n📝 Attempting to parse JSON...');
    
    const parsed = extractJsonObject(text);
    
    console.log('Parsed Result:', parsed ? JSON.stringify(parsed, null, 2) : 'NULL (parsing failed)');
    console.log('================================\n');
    
    if (parsed && typeof parsed.score === 'number') {
      // Ensure score is within valid range
      const validScore = Math.max(0, Math.min(100, Math.round(parsed.score)));
      
      const result = {
        score: validScore,
        summary: parsed.summary || 'AI-generated summary not available',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : ['Continue uploading required documents and review visa requirements'],
      };
      
      console.log('✅ Final Evaluation:', JSON.stringify(result, null, 2));
      return result;
    }

    // Fallback if parsing fails - calculate basic score
    const completeness = documents.length / (visa.requiredDocuments.length || 1);
    const fallbackScore = Math.round(completeness * 85); // Cap at 85 for incomplete parsing

    console.log('⚠️  Using fallback score (parsing failed)');
    return {
      score: fallbackScore,
      summary: (typeof text === 'string' ? text : '').substring(0, 300) || 'Application under review. Upload all required documents for accurate evaluation.',
      suggestions: ['Review your application and upload missing documents', 'Ensure all documents are current and clearly labeled'],
    };
  } catch (error) {
    const mapped = mapGeminiError(error);

    // Avoid spamming the console on repeated user actions.
    // Log non-retryable/config issues once; log retryable errors normally.
    if (!mapped.retryable) {
      if (!aiWarningShown) {
        aiWarningShown = true;
        // eslint-disable-next-line no-console
        console.warn(`⚠️  Gemini unavailable (${mapped.code}): ${mapped.message}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.error('❌ Gemini API Error:', error?.message ?? error);
    }

    throw new AIEvaluationError(mapped.message, {
      statusCode: mapped.statusCode,
      code: mapped.code,
      retryable: mapped.retryable,
      cause: error,
    });
  }
}
