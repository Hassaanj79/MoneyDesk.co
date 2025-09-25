#!/usr/bin/env node

/**
 * Script to help copy environment variables for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Environment Variables Setup\n');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse environment variables
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('📋 Copy these environment variables to Vercel:\n');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Select your MoneyDesk.co project');
console.log('3. Go to Settings → Environment Variables');
console.log('4. Add these variables:\n');

// Required variables for production
const requiredVars = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_APP_DOMAIN'
];

requiredVars.forEach((varName, index) => {
  if (envVars[varName]) {
    console.log(`${index + 1}. ${varName}:`);
    console.log(`   Value: ${envVars[varName]}`);
    console.log('');
  } else {
    console.log(`${index + 1}. ${varName}: ❌ NOT SET`);
    console.log('');
  }
});

console.log('5. After adding all variables, redeploy your project');
console.log('6. Check the admin panel at: https://your-domain.vercel.app/admin');
console.log('');

console.log('🔍 To verify it\'s working:');
console.log('- Look for "Firebase Admin SDK successfully initialized" in Vercel logs');
console.log('- Admin panel should show real user data instead of mock data');
console.log('');

console.log('📖 For detailed instructions, see PRODUCTION_SETUP.md');
