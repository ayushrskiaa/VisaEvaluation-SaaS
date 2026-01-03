/**
 * Comprehensive Feature Verification Script
 * Tests all core functionality of the visa evaluation platform
 */

import { connectToDatabase, disconnectFromDatabase } from '../src/config/database.js';
import { createApp } from '../src/app.js';
import { getCountries, getVisaTypeById } from '../src/data/visaCatalog.data.js';
import { Evaluation } from '../src/models/Evaluation.model.js';
import { fileStoreCreateEvaluation, fileStoreGetEvaluation } from '../src/storage/evaluationFileStore.js';

async function verifyFeatures() {
  console.log('🔍 COMPREHENSIVE FEATURE VERIFICATION\n');
  console.log('=' .repeat(60));
  
  let allPassed = true;
  const results = [];

  // Test 1: Catalog Data
  console.log('\n📚 Test 1: Multi-Country Visa Catalog');
  try {
    const countries = getCountries();
    const requiredCountries = ['US', 'IE', 'PL', 'FR', 'NL', 'DE'];
    const hasAllCountries = requiredCountries.every(code => 
      countries.some(c => c.code === code)
    );
    
    if (hasAllCountries && countries.length === 6) {
      console.log('✅ PASSED: All 6 countries configured');
      results.push({ test: 'Multi-Country Support', status: 'PASS' });
    } else {
      throw new Error(`Expected 6 countries, found ${countries.length}`);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    results.push({ test: 'Multi-Country Support', status: 'FAIL' });
    allPassed = false;
  }

  // Test 2: Visa Types
  console.log('\n📋 Test 2: Visa Type Configuration');
  try {
    const usVisa = getVisaTypeById('US_H1B');
    if (usVisa && usVisa.requiredDocuments.length > 0) {
      console.log('✅ PASSED: Visa types have required documents');
      results.push({ test: 'Visa Configuration', status: 'PASS' });
    } else {
      throw new Error('Visa configuration missing required documents');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    results.push({ test: 'Visa Configuration', status: 'FAIL' });
    allPassed = false;
  }

  // Test 3: MongoDB Connection
  console.log('\n🗄️  Test 3: Database Connection');
  let mongoEnabled = false;
  try {
    const info = await connectToDatabase();
    mongoEnabled = Boolean(info?.enabled);
    if (mongoEnabled) {
      console.log('✅ PASSED: MongoDB connected successfully');
      results.push({ test: 'MongoDB Connection', status: 'PASS' });
    } else {
      console.log(`⚠️  MongoDB disabled (${info?.reason ?? 'unknown reason'}). Using JSON storage fallback.`);
      results.push({ test: 'MongoDB Connection', status: 'SKIP (JSON fallback)' });
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    results.push({ test: 'MongoDB Connection', status: 'FAIL' });
    allPassed = false;
  }

  // Test 4: Evaluation Model
  console.log('\n📝 Test 4: Evaluation CRUD');
  try {
    if (mongoEnabled) {
      const testEval = await Evaluation.create({
        name: 'Test User',
        email: 'test@example.com',
        countryCode: 'US',
        visaTypeId: 'US_H1B',
        documents: [],
        rawScore: 0,
        score: 0,
        scoreCap: 85,
        summary: 'Test evaluation',
        suggestions: ['Test suggestion'],
      });
      
      const found = await Evaluation.findById(testEval._id);
      await Evaluation.deleteOne({ _id: testEval._id });
      
      if (found && found.email === 'test@example.com') {
        console.log('✅ PASSED: Evaluation CRUD working (MongoDB)');
        results.push({ test: 'Evaluation Storage', status: 'PASS' });
      } else {
        throw new Error('Could not retrieve saved evaluation');
      }
    } else {
      const created = await fileStoreCreateEvaluation({
        name: 'Test User',
        email: 'test@example.com',
        countryCode: 'US',
        visaTypeId: 'US_H1B',
        documents: [],
        rawScore: 0,
        score: 0,
        scoreCap: 85,
        summary: 'Test evaluation',
        suggestions: ['Test suggestion'],
        createdAt: new Date(),
      });
      const found = await fileStoreGetEvaluation(created.id);
      if (found && found.email === 'test@example.com') {
        console.log('✅ PASSED: Evaluation CRUD working (JSON fallback)');
        results.push({ test: 'Evaluation Storage', status: 'PASS' });
      } else {
        throw new Error('Could not retrieve saved evaluation (JSON fallback)');
      }
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    results.push({ test: 'Evaluation Storage', status: 'FAIL' });
    allPassed = false;
  }

  // Test 5: Express App
  console.log('\n🚀 Test 5: Express Application');
  try {
    const app = createApp();
    if (app && typeof app.listen === 'function') {
      console.log('✅ PASSED: Express app configured correctly');
      results.push({ test: 'Express App', status: 'PASS' });
    } else {
      throw new Error('Express app not configured properly');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    results.push({ test: 'Express App', status: 'FAIL' });
    allPassed = false;
  }

  // Test 6: Environment Configuration
  console.log('\n⚙️  Test 6: Environment Configuration');
  try {
    const hasPort = !!process.env.PORT;
    const hasScoreCap = !!process.env.MAX_SCORE_CAP;
    
    if (hasPort && hasScoreCap) {
      console.log('✅ PASSED: Essential env variables configured');
      results.push({ test: 'Environment Config', status: 'PASS' });
    } else {
      throw new Error('Missing essential environment variables');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    results.push({ test: 'Environment Config', status: 'FAIL' });
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status.startsWith('SKIP') ? '⚠️' : '❌';
    console.log(`${icon} ${r.test}: ${r.status}`);
  });
  
  const passCount = results.filter(r => r.status === 'PASS' || r.status.startsWith('SKIP')).length;
  const totalTests = results.length;
  const percentage = Math.round((passCount / totalTests) * 100);
  
  console.log(`\n📈 Score: ${passCount}/${totalTests} tests passed (${percentage}%)`);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! System is ready for submission.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }

  await disconnectFromDatabase();
}

verifyFeatures().catch(err => {
  console.error('\n❌ Fatal Error:', err);
  process.exit(1);
});
