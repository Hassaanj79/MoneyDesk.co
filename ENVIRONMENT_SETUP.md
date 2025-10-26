# Environment Variables Setup for Firebase AI Logic & Google Vision API

## Required Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Firebase Configuration (you already have these)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Service Account Key (REQUIRED for AI Logic)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Google Cloud Project ID (same as Firebase project)
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Optional: Google Application Credentials (alternative to service account key)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## How to Get Your Service Account Key

### Method 1: From Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Project Settings" (gear icon)
4. Click "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY`

### Method 2: From Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "IAM & Admin" > "Service Accounts"
4. Find your Firebase service account (usually `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`)
5. Click on it, then "Keys" tab
6. Click "Add Key" > "Create new key"
7. Choose "JSON" format
8. Download and use the content

## Enable Required APIs

### 1. Enable Firebase AI Logic
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Look for "AI Logic" in the left sidebar
4. Click "Get Started" to enable it

### 2. Enable Vertex AI API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Library"
4. Search for "Vertex AI API"
5. Click on it and "Enable"

### 3. Enable Vision API (for receipt OCR)
1. In the same "APIs & Services" > "Library"
2. Search for "Vision API"
3. Click on it and "Enable"

## Service Account Permissions

Your service account needs these roles:
- `Firebase Admin SDK Administrator Service Agent`
- `Vertex AI User`
- `AI Platform Developer`
- `Cloud Vision API User`

## Testing the Setup

After setting up the environment variables:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Test the endpoints:
   ```bash
   curl http://localhost:3000/api/gemini-ai
   curl http://localhost:3000/api/test-vision-api
   ```

3. You should see `"available": true` in the responses

## Troubleshooting

### Common Issues:

1. **"Could not load the default credentials"**
   - Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
   - Ensure the JSON is properly formatted (no extra spaces/newlines)
   - The private key should have `\n` characters for line breaks

2. **"Firebase AI Logic not enabled"**
   - Enable AI Logic in Firebase Console
   - Enable Vertex AI API in Google Cloud Console

3. **"Vision API not enabled"**
   - Enable Vision API in Google Cloud Console
   - Check service account has Vision API User role

### Debug Commands:
```bash
# Check if environment variables are loaded
curl http://localhost:3000/api/test-env

# Check Firebase AI Logic status
curl http://localhost:3000/api/gemini-ai

# Check Google Vision API status
curl http://localhost:3000/api/test-vision-api
```

## Security Notes

- Never commit `.env.local` to version control
- Keep your service account key secure
- Rotate keys regularly
- Use environment variables in production (Vercel, etc.)
