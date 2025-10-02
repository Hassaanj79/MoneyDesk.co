# OAuth Setup Guide

This guide explains how to configure Google and Apple sign-in for your MoneyDesk application.

## Google Sign-In Setup

### 1. Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable** to ON
6. Add your project's **Web SDK configuration** to the authorized domains
7. Click **Save**

### 2. Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Configure the consent screen with your app information
5. Add authorized domains:
   - `localhost` (for development)
   - `yourdomain.com` (for production)

### 3. Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Add authorized redirect URIs:
   - `http://localhost:3000/__/auth/handler` (for development)
   - `https://yourdomain.com/__/auth/handler` (for production)

## Apple Sign-In Setup

### 1. Enable Apple Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Apple** provider
5. Toggle **Enable** to ON
6. Configure the Apple Sign-In settings:
   - **Service ID**: Your Apple Developer Service ID
   - **Apple Team ID**: Your Apple Developer Team ID
   - **Key ID**: Your Apple Sign-In Key ID
   - **Private Key**: Your Apple Sign-In Private Key

### 2. Apple Developer Account Setup

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a **Services ID** for your app
4. Enable **Sign In with Apple** capability
5. Create a **Key** for Sign In with Apple
6. Download the private key (.p8 file)

### 3. Configure Apple Sign-In

1. In Apple Developer Console, go to **Identifiers** > **Services IDs**
2. Select your Service ID
3. Enable **Sign In with Apple**
4. Configure the domains and redirect URLs:
   - Primary App ID: Your app's bundle identifier
   - Website URLs: Your domain (e.g., `https://yourdomain.com`)

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Google OAuth (already configured in Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Apple Sign-In (if using custom configuration)
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=your_private_key
```

## Testing

### Development
- Both Google and Apple sign-in work on `localhost:3000`
- Make sure to test with different browsers and devices

### Production
- Update authorized domains in both Google and Apple consoles
- Ensure your production domain is properly configured
- Test the complete sign-in flow

## Troubleshooting

### Common Issues

1. **"This app is not verified"** (Google)
   - This is normal for development
   - Submit your app for verification in production

2. **"Invalid client"** (Apple)
   - Check your Service ID configuration
   - Verify the redirect URLs match exactly

3. **"Domain not authorized"**
   - Add your domain to the authorized domains list
   - Check both Google and Apple console settings

### Debug Mode

Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'firebase:*');
```

## Security Notes

- Never commit your private keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor authentication logs for suspicious activity

## Support

For issues with OAuth setup:
- Check Firebase Console logs
- Verify domain configuration
- Test with different browsers
- Contact support if issues persist

