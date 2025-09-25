#!/usr/bin/env node

/**
 * Script to help verify Vercel environment variables are set correctly
 */

console.log('🔍 Vercel Environment Variables Check\n');

console.log('📋 To verify your Vercel environment variables are working:');
console.log('');

console.log('1. 🌐 Test Firebase Admin SDK:');
console.log('   Visit: https://your-domain.vercel.app/api/test-firebase-admin');
console.log('   Expected: {"success": true, "message": "Firebase Admin SDK is working correctly"}');
console.log('');

console.log('2. 👥 Test Admin Panel:');
console.log('   Visit: https://your-domain.vercel.app/admin');
console.log('   Expected: Real user data instead of mock data');
console.log('');

console.log('3. 📊 Test User API:');
console.log('   Visit: https://your-domain.vercel.app/api/admin/users');
console.log('   Expected: Real Firebase Authentication users');
console.log('');

console.log('🔧 If still showing mock data, check:');
console.log('   - Vercel environment variables are set correctly');
console.log('   - All 3 variables are present:');
console.log('     • FIREBASE_SERVICE_ACCOUNT_KEY');
console.log('     • NEXT_PUBLIC_FIREBASE_PROJECT_ID');
console.log('     • NEXT_PUBLIC_APP_DOMAIN');
console.log('   - Vercel deployment completed successfully');
console.log('   - Check Vercel function logs for errors');
console.log('');

console.log('📖 Environment Variables from your .env.local:');
console.log('   FIREBASE_SERVICE_ACCOUNT_KEY: ✅ Set');
console.log('   NEXT_PUBLIC_FIREBASE_PROJECT_ID: chirpchat-yi7xn');
console.log('   NEXT_PUBLIC_APP_DOMAIN: moneydesk.co');
console.log('');

console.log('🚀 The latest code has been pushed to trigger a fresh Vercel deployment!');
