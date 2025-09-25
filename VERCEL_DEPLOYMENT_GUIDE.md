# Vercel Deployment Configuration Guide

## Environment Variables Setup

To make your admin panel work properly in production, you need to configure the following environment variables in Vercel:

### Required Environment Variables

1. **FIREBASE_SERVICE_ACCOUNT_KEY**
   - This is your Firebase service account key (JSON format)
   - Copy the entire JSON object from your local `.env.local` file
   - This enables the Firebase Admin SDK to work in production

2. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Your Firebase project ID: `chirpchat-yi7xn`

3. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - Your Firebase API key (from Firebase Console)

4. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Your Firebase auth domain: `chirpchat-yi7xn.firebaseapp.com`

5. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Your Firebase storage bucket: `chirpchat-yi7xn.appspot.com`

6. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Your Firebase messaging sender ID

7. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - Your Firebase app ID

8. **NEXT_PUBLIC_APP_DOMAIN**
   - Your production domain: `moneydesk.co`

## How to Configure Environment Variables in Vercel

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Find your MoneyDesk.co project

### Step 2: Add Environment Variables
1. Click on your project
2. Go to **Settings** tab
3. Click on **Environment Variables** in the left sidebar
4. Add each environment variable:

#### For Production Environment:
- **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
- **Value**: `{"type":"service_account","project_id":"chirpchat-yi7xn",...}` (full JSON)
- **Environment**: Production

- **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- **Value**: `chirpchat-yi7xn`
- **Environment**: Production

- **Name**: `NEXT_PUBLIC_APP_DOMAIN`
- **Value**: `moneydesk.co`
- **Environment**: Production

### Step 3: Redeploy
1. After adding all environment variables
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or push a new commit to trigger automatic deployment

## Verification Steps

After deployment, verify that:
1. Admin panel loads without debug mode
2. Firebase Admin SDK initializes properly
3. Real user data is fetched (not mock data)
4. Admin authentication works correctly

## Troubleshooting

If the admin panel still shows issues:
1. Check Vercel function logs for errors
2. Verify all environment variables are set correctly
3. Ensure the Firebase service account key is properly formatted
4. Check that the Firebase project has the correct permissions

## Security Notes

- Never commit `.env.local` to git
- The service account key should only be in Vercel environment variables
- Make sure your Firebase project has proper security rules
