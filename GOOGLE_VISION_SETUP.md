# Google Vision API Configuration Guide

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Option 1: Service Account Key (Recommended for production)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Option 2: Service Account Key as JSON string (for Vercel/cloud deployment)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'

# Option 3: API Key (Limited functionality)
GOOGLE_VISION_API_KEY=your-api-key
```

## Setup Steps

### 1. Enable Google Vision API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Vision API" and enable it

### 2. Create Service Account (Recommended)
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `moneydesk-vision-api`
4. Description: `Service account for MoneyDesk receipt OCR processing`
5. Click "Create and Continue"
6. Grant roles:
   - `Cloud Vision API User`
   - `Storage Object Viewer` (if using Cloud Storage)
7. Click "Done"

### 3. Generate Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file

### 4. Configure Environment Variables

#### For Local Development:
```bash
# .env.local
GOOGLE_APPLICATION_CREDENTIALS=/path/to/downloaded/key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

#### For Production (Vercel/Cloud):
```bash
# Add to your deployment platform's environment variables
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## Testing the Integration

1. Start your development server: `npm run dev`
2. Navigate to the transaction form
3. Upload or capture a receipt image
4. Check the browser console for OCR processing logs
5. Verify that form fields are auto-filled with extracted data

## Troubleshooting

### Common Issues:

1. **"Google Vision API client not initialized"**
   - Check that environment variables are set correctly
   - Verify the service account has proper permissions
   - Ensure the Vision API is enabled in your project

2. **"No text found in the image"**
   - Ensure the receipt image is clear and readable
   - Try with a higher resolution image
   - Check that the image contains text (not just logos)

3. **"Invalid image data format"**
   - Ensure the image is in a supported format (JPEG, PNG, GIF, BMP, WEBP)
   - Check that the image size is under 10MB

### Debug Mode:
Add this to your `.env.local` for detailed logging:
```bash
DEBUG=google-vision-ocr
```

## API Usage Limits

- **Free Tier**: 1,000 requests per month
- **Paid Tier**: $1.50 per 1,000 requests
- **Image Size**: Maximum 20MB per image
- **Supported Formats**: JPEG, PNG, GIF, BMP, WEBP, TIFF, ICO

## Security Notes

- Never commit service account keys to version control
- Use environment variables for all credentials
- Regularly rotate service account keys
- Monitor API usage and set up billing alerts
