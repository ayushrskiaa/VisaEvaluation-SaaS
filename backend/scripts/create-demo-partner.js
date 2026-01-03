/**
 * Create Demo Partner
 * 
 * This script creates a demo partner account with an API key
 * for testing the partner embed feature.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Import Partner model
import { Partner } from '../src/models/Partner.model.js';

async function createDemoPartner() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visa-eval';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Generate API key
    const apiKey = 'pk_demo_' + crypto.randomBytes(16).toString('hex');

    // Create demo partner
    const partner = new Partner({
      name: 'Demo Legal Services',
      email: 'demo@legalsphere.com',
      website: 'https://demo-legal.com',
      apiKey: apiKey,
      evaluationCount: 0,
    });

    await partner.save();

    console.log('🎉 Demo Partner Created Successfully!\n');
    console.log('Partner Details:');
    console.log('================');
    console.log(`Name:    ${partner.name}`);
    console.log(`Email:   ${partner.email}`);
    console.log(`Website: ${partner.website}`);
    console.log(`API Key: ${partner.apiKey}`);
    console.log('');
    console.log('🔗 Embed URL:');
    console.log(`http://localhost:5174/embed?apiKey=${partner.apiKey}`);
    console.log('');
    console.log('📝 Test the Partner API:');
    console.log(`curl -H "x-api-key: ${partner.apiKey}" http://localhost:4000/api/partners/me`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('Partner with this email already exists.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the script
createDemoPartner();
