#!/usr/bin/env node

// Quick test to verify Google Gemini API key works
require('dotenv').config({ path: './apps/api/.env' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  console.log('🧪 Testing Google Gemini API...\n');

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey || apiKey === 'your-google-ai-api-key') {
    console.error('❌ No API key configured!');
    process.exit(1);
  }

  console.log('✅ API key found:', apiKey.substring(0, 10) + '...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log('📡 Sending test request...');

    const result = await model.generateContent(
      'Say "Hello! I am working!" in exactly 5 words.'
    );

    const response = await result.response;
    const text = response.text();

    console.log('\n✅ API Response:', text);
    console.log('\n🎉 Google Gemini API is working perfectly!');
    console.log('\n✅ Ready to generate LinkedIn templates!');

  } catch (error) {
    console.error('\n❌ API Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Check if the API key is valid at:');
      console.log('   https://makersuite.google.com/app/apikey');
    }
    
    process.exit(1);
  }
}

testGeminiAPI().catch(console.error);
