#!/usr/bin/env node

/**
 * Script to help get environment variables for production deployment
 * Run this script to see what environment variables you need to set in Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Production Environment Setup Helper\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('Please create a .env.local file with your environment variables');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse environment variables
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('📋 Environment Variables for Vercel:\n');

// Required variables for production
const requiredVars = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_APP_DOMAIN'
];

requiredVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName}:`);
    if (varName === 'FIREBASE_SERVICE_ACCOUNT_KEY') {
      // For service account key, show first few characters only
      const key = envVars[varName];
      console.log(`   ${key.substring(0, 50)}...`);
      console.log('   (Full JSON key - copy the entire value)');
    } else {
      console.log(`   ${envVars[varName]}`);
    }
    console.log('');
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    console.log('');
  }
});

console.log('🚀 Next Steps:');
console.log('1. Go to your Vercel dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add the variables shown above');
console.log('5. Redeploy your project');
console.log('');

console.log('📖 For detailed instructions, see PRODUCTION_SETUP.md');
