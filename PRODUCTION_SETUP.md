# Production Environment Setup Guide

## Firebase Admin SDK Configuration

To enable real-time data in the admin panel on production (GitHub/Vercel), you need to configure the Firebase Admin SDK properly.

### Option 1: Service Account Key (Recommended)

1. **Get your Firebase Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add to Vercel Environment Variables:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add the following variables:

   ```
   FIREBASE_SERVICE_ACCOUNT_KEY = [paste the entire JSON content here]
   NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-project-id
   NEXT_PUBLIC_APP_DOMAIN = moneydesk.co
   ```

3. **Important:** The `FIREBASE_SERVICE_ACCOUNT_KEY` should be the **entire JSON content** as a single line string.

### Option 2: Application Default Credentials (Alternative)

If you prefer not to use a service account key, you can set up Application Default Credentials:

1. **Install Google Cloud CLI:**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. **Authenticate:**
   ```bash
   gcloud auth application-default login
   ```

3. **Set project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Deploy to Vercel:**
   - Vercel will automatically use the Application Default Credentials
   - Make sure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set

### Environment Variables Checklist

Make sure these are set in your Vercel project:

- ✅ `FIREBASE_SERVICE_ACCOUNT_KEY` (entire JSON as string)
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (your Firebase project ID)
- ✅ `NEXT_PUBLIC_APP_DOMAIN` (moneydesk.co)

### Testing the Setup

1. **Deploy to Vercel** after setting environment variables
2. **Check the logs** in Vercel dashboard:
   - Go to Functions → View Function Logs
   - Look for "Firebase Admin SDK successfully initialized"
3. **Test the admin panel** at `https://your-domain.vercel.app/admin`

### Troubleshooting

**If you see "Firebase Admin SDK not available, returning mock data":**

1. Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is properly set
2. Verify the JSON is valid (no extra quotes or formatting)
3. Ensure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project
4. Check Vercel function logs for detailed error messages

**Common Issues:**

- ❌ **Invalid JSON**: Make sure the service account key is valid JSON
- ❌ **Missing project ID**: Ensure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set
- ❌ **Wrong project**: Verify the project ID matches your Firebase project
- ❌ **Permissions**: Ensure the service account has proper permissions

### Security Notes

- Never commit the service account key to your repository
- Use environment variables for all sensitive data
- Regularly rotate your service account keys
- Monitor your Firebase usage and costs

## Current Status

- ✅ **Local Development**: Working with real Firebase data
- ❌ **Production**: Using mock data (needs environment setup)
- 🔧 **Next Steps**: Configure environment variables in Vercel
