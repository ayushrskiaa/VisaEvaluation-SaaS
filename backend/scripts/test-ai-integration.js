import dotenv from 'dotenv';

import { generateAIEvaluation } from '../src/services/ai.service.js';

dotenv.config();

const testVisa = {
  code: 'US_H1B',
  name: 'H-1B Specialty Occupation',
  country: 'United States',
  countryCode: 'US',
  description: 'For professionals in specialty occupations that require theoretical or technical expertise',
  requiredDocuments: ['Resume/CV', 'University Degree', 'Job Offer Letter', 'Passport Copy'],
};

const testDocuments = [
  { documentType: 'Resume/CV' },
  { documentType: 'Job Offer Letter' },
];

async function testAI() {
  console.log('🧪 Testing AI Integration (Gemini)...\n');

  try {
    console.log('📝 Test Visa:', testVisa.name);
    console.log('📄 Uploaded:', testDocuments.map((d) => d.documentType).join(', '));
    console.log('❌ Missing: University Degree, Passport Copy\n');

    console.log('🤖 Calling Gemini API...');
    const result = await generateAIEvaluation({
      visa: testVisa,
      documents: testDocuments,
      missingDocuments: ['University Degree', 'Passport Copy'],
      rawScore: 50,
      score: 50,
      applicantName: 'Test Applicant',
    });

    console.log('\n✅ AI Response:');
    console.log('Summary:', result.summary);
    console.log('\nSuggestions:');
    result.suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));

    console.log('\n✨ AI integration working!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testAI();
