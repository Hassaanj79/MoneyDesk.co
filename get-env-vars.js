#!/usr/bin/env node

// Script to extract environment variables for Vercel deployment
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('🔧 Environment Variables for Vercel Deployment\n');
  console.log('Copy these to your Vercel project settings:\n');
  
  const lines = envContent.split('\n');
  const envVars = [];
  
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      
      if (key.startsWith('NEXT_PUBLIC_') || key === 'FIREBASE_SERVICE_ACCOUNT_KEY') {
        envVars.push({ key, value });
      }
    }
  });
  
  envVars.forEach(({ key, value }) => {
    console.log(`📋 ${key}`);
    console.log(`   Value: ${value.length > 100 ? value.substring(0, 100) + '...' : value}`);
    console.log(`   Environment: Production\n`);
  });
  
  console.log('✅ Copy these to Vercel → Project Settings → Environment Variables');
  console.log('🔗 Vercel Dashboard: https://vercel.com/dashboard');
  
} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message);
  console.log('Make sure you have a .env.local file in your project root');
}
