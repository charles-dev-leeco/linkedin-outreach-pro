#!/usr/bin/env node

require('dotenv').config({ path: './apps/api/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('📡 Fetching available models...\n');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:\n');
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
        console.log(`    Display: ${model.displayName}`);
        console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
