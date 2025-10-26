# Firebase AI Logic SDK Integration Guide

## Overview

This guide covers the integration of Firebase AI Logic SDK with Gemini API in your MoneyDesk.co application. This provides advanced AI capabilities including intelligent receipt parsing, smart categorization, spending analysis, and duplicate detection.

## What's Been Implemented

### ✅ **Core Integration**
- Firebase AI Logic SDK installed (`@firebase/vertexai-preview`)
- Firebase configuration updated with Vertex AI initialization
- Gemini service created with advanced AI capabilities

### ✅ **AI Features Available**
1. **Intelligent Receipt Parsing**: Uses Gemini to extract structured data from receipt text
2. **Smart Category Suggestions**: AI-powered categorization with reasoning
3. **Advanced Spending Analysis**: Comprehensive insights and recommendations
4. **Intelligent Duplicate Detection**: Context-aware duplicate identification

### ✅ **API Endpoints**
- `/api/gemini-ai` - Main Gemini AI endpoint with multiple actions
- `/api/receipt-ocr` - Enhanced receipt processing (now uses Gemini)
- `/api/test-vision-api` - Health check for Google Vision API

## Setup Requirements

### 1. Enable Firebase AI Logic

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to "AI Logic" in the left sidebar
4. Click "Get Started" to enable AI Logic
5. Accept the terms and enable the service

### 2. Configure Vertex AI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Vertex AI API" and enable it
5. Go to "IAM & Admin" > "Service Accounts"
6. Ensure your Firebase service account has Vertex AI permissions

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Service Account (for server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Google Cloud Configuration (for Vision API)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Usage Examples

### 1. Receipt Processing with Gemini

```typescript
// The receipt processing now automatically uses Gemini when available
const response = await fetch('/api/receipt-ocr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageData: base64Image })
});

const result = await response.json();
// result.data now includes Gemini-enhanced parsing
```

### 2. Smart Category Suggestions

```typescript
import { useAIFeatures } from '@/hooks/use-ai-features';

const { getGeminiCategorySuggestions, geminiAvailable } = useAIFeatures();

if (geminiAvailable) {
  const suggestions = await getGeminiCategorySuggestions(
    "Starbucks Coffee", 
    5.50
  );
  // Returns: [{ category: "Food & Dining", confidence: 0.95, reasoning: "..." }]
}
```

### 3. Advanced Spending Analysis

```typescript
const { generateGeminiSpendingAnalysis } = useAIFeatures();

const analysis = await generateGeminiSpendingAnalysis(transactions);
// Returns: { insights: [...], recommendations: [...], trends: [...], alerts: [...] }
```

### 4. Intelligent Duplicate Detection

```typescript
const { detectGeminiDuplicates } = useAIFeatures();

const result = await detectGeminiDuplicates(newTransaction, existingTransactions);
// Returns: { isDuplicate: true, confidence: 0.9, reason: "Similar merchant and amount" }
```

## API Reference

### `/api/gemini-ai` Endpoints

#### POST - Category Suggestions
```json
{
  "action": "category-suggestions",
  "data": {
    "transactionName": "Starbucks Coffee",
    "amount": 5.50,
    "existingCategories": ["Food & Dining", "Shopping", "Entertainment"]
  }
}
```

#### POST - Spending Analysis
```json
{
  "action": "spending-analysis",
  "data": {
    "transactions": [
      {"name": "Coffee", "amount": 5.50, "category": "Food", "date": "2024-01-15"}
    ],
    "timeRange": "last 30 days"
  }
}
```

#### POST - Duplicate Detection
```json
{
  "action": "duplicate-detection",
  "data": {
    "newTransaction": {"name": "Coffee", "amount": 5.50, "date": "2024-01-15"},
    "existingTransactions": [...]
  }
}
```

#### POST - Receipt Parsing
```json
{
  "action": "receipt-parsing",
  "data": {
    "receiptText": "STARBUCKS COFFEE\nGrande Latte $4.50\nTotal $4.50"
  }
}
```

## Testing the Integration

### 1. Health Check
Visit `/api/gemini-ai` to check if Firebase Gemini is properly configured.

### 2. Test Receipt Processing
1. Go to the transaction form
2. Upload or capture a receipt image
3. Check browser console for Gemini processing logs
4. Verify that form fields are auto-filled with extracted data

### 3. Test AI Features
```typescript
// In your React components
const { geminiAvailable, getGeminiCategorySuggestions } = useAIFeatures();

if (geminiAvailable) {
  console.log('Gemini AI is ready!');
  // Test category suggestions
  const suggestions = await getGeminiCategorySuggestions("Test Transaction", 10.00);
  console.log('Suggestions:', suggestions);
}
```

## Troubleshooting

### Common Issues:

1. **"Firebase Gemini is not configured"**
   - Ensure Firebase AI Logic is enabled in Firebase Console
   - Check that Vertex AI API is enabled in Google Cloud Console
   - Verify service account has proper permissions

2. **"Vertex AI API not enabled"**
   - Go to Google Cloud Console > APIs & Services > Library
   - Search for "Vertex AI API" and enable it
   - Wait a few minutes for the API to propagate

3. **"Service account lacks permissions"**
   - Go to Google Cloud Console > IAM & Admin > IAM
   - Find your Firebase service account
   - Add roles: "Vertex AI User", "AI Platform Developer"

4. **Receipt processing falls back to rule-based parsing**
   - This is normal behavior when Gemini is unavailable
   - Check console logs for specific error messages
   - Ensure Firebase AI Logic is properly configured

### Debug Mode:
Add this to your `.env.local` for detailed logging:
```bash
DEBUG=firebase-gemini,google-vision-ocr
```

## Performance Considerations

- **Gemini API Limits**: Free tier includes generous usage limits
- **Caching**: Implement caching for frequently requested data
- **Fallbacks**: Always have fallback logic when AI services are unavailable
- **Error Handling**: Graceful degradation when AI features fail

## Security Notes

- Firebase AI Logic uses your existing Firebase authentication
- All AI processing happens server-side for security
- No sensitive data is sent to external AI services
- Service account keys should be kept secure and rotated regularly

## Next Steps

1. **Enable Firebase AI Logic** in your Firebase Console
2. **Test the integration** with sample receipts
3. **Monitor usage** and set up billing alerts
4. **Customize prompts** for your specific use cases
5. **Add more AI features** as needed

Your MoneyDesk.co application now has powerful AI capabilities powered by Firebase AI Logic and Gemini! 🚀
