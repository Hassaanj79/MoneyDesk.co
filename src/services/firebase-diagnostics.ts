// Firebase Diagnostics Service
// This service helps diagnose Firebase configuration issues without interfering with existing code

import { auth } from '@/lib/firebase';

export interface FirebaseDiagnosticResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  recommendations?: string[];
}

export interface FirebaseConfigStatus {
  isAvailable: boolean;
  hasConfig: boolean;
  projectId?: string;
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive Firebase configuration diagnostics
 */
export const diagnoseFirebaseConfig = (): FirebaseConfigStatus => {
  const result: FirebaseConfigStatus = {
    isAvailable: false,
    hasConfig: false,
    errors: [],
    warnings: []
  };

  try {
    // Check if auth instance exists
    if (!auth) {
      result.errors.push('Firebase auth instance is not available');
      return result;
    }

    result.isAvailable = true;

    // Check if config exists
    if (!auth.config) {
      result.errors.push('Firebase config is not available');
      return result;
    }

    result.hasConfig = true;
    const config = auth.config;

    // Extract configuration details
    result.projectId = config.projectId;
    result.apiKey = config.apiKey ? 'Set' : 'Not set';
    result.authDomain = config.authDomain;
    result.databaseURL = config.databaseURL;
    result.storageBucket = config.storageBucket;
    result.messagingSenderId = config.messagingSenderId;
    result.appId = config.appId;

    // Validate required fields
    if (!config.projectId) {
      result.errors.push('Project ID is missing');
    }

    if (!config.apiKey) {
      result.errors.push('API Key is missing');
    }

    if (!config.authDomain) {
      result.errors.push('Auth Domain is missing');
    }

    // Check for common configuration issues
    if (config.apiKey && config.apiKey.length < 20) {
      result.warnings.push('API Key seems too short');
    }

    if (config.authDomain && !config.authDomain.includes('firebaseapp.com')) {
      result.warnings.push('Auth Domain format seems incorrect');
    }

    // Check environment variables
    if (typeof window !== 'undefined') {
      const envVars = {
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      const missingEnvVars = Object.entries(envVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingEnvVars.length > 0) {
        result.warnings.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      }
    }

  } catch (error: any) {
    result.errors.push(`Diagnostic error: ${error.message}`);
  }

  return result;
};

/**
 * Test Firebase authentication initialization
 */
export const testFirebaseAuth = async (): Promise<FirebaseDiagnosticResult> => {
  try {
    if (!auth) {
      return {
        status: 'error',
        message: 'Firebase auth instance is not available',
        recommendations: [
          'Check if Firebase is properly initialized',
          'Verify Firebase configuration in your app'
        ]
      };
    }

    // Test basic auth operations
    const currentUser = auth.currentUser;
    const authState = auth.authStateReady ? 'Available' : 'Not available';

    return {
      status: 'success',
      message: 'Firebase auth is properly initialized',
      details: {
        currentUser: currentUser ? 'Logged in' : 'Not logged in',
        authStateReady: authState,
        config: auth.config ? 'Available' : 'Not available'
      }
    };

  } catch (error: any) {
    return {
      status: 'error',
      message: `Firebase auth test failed: ${error.message}`,
      recommendations: [
        'Check Firebase configuration',
        'Verify API keys are correct',
        'Ensure Firebase project is properly set up'
      ]
    };
  }
};

/**
 * Test Firebase Phone Auth availability
 */
export const testFirebasePhoneAuth = async (): Promise<FirebaseDiagnosticResult> => {
  try {
    if (!auth) {
      return {
        status: 'error',
        message: 'Firebase auth not available',
        recommendations: ['Initialize Firebase properly']
      };
    }

    // Check if Phone Auth is enabled (this is a client-side check)
    // Note: We can't actually test if Phone Auth is enabled without making a request
    // But we can check if the necessary modules are available

    const hasPhoneAuth = typeof window !== 'undefined' && 
                        typeof (window as any).firebase !== 'undefined';

    if (!hasPhoneAuth) {
      return {
        status: 'warning',
        message: 'Phone Auth modules may not be properly loaded',
        recommendations: [
          'Check if Firebase Phone Auth is enabled in Firebase Console',
          'Verify Firebase SDK is properly imported',
          'Ensure reCAPTCHA is configured'
        ]
      };
    }

    return {
      status: 'success',
      message: 'Firebase Phone Auth appears to be available',
      recommendations: [
        'Test with a real phone number to confirm',
        'Check Firebase Console for Phone Auth settings'
      ]
    };

  } catch (error: any) {
    return {
      status: 'error',
      message: `Phone Auth test failed: ${error.message}`,
      recommendations: [
        'Check Firebase Console configuration',
        'Verify Phone Auth is enabled',
        'Check reCAPTCHA settings'
      ]
    };
  }
};

/**
 * Get comprehensive Firebase diagnostics
 */
export const getFirebaseDiagnostics = async () => {
  const configStatus = diagnoseFirebaseConfig();
  const authTest = await testFirebaseAuth();
  const phoneAuthTest = await testFirebasePhoneAuth();

  return {
    config: configStatus,
    auth: authTest,
    phoneAuth: phoneAuthTest,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    environment: typeof window !== 'undefined' ? 'Browser' : 'Server'
  };
};

/**
 * Generate Firebase setup recommendations
 */
export const getFirebaseSetupRecommendations = (diagnostics: any): string[] => {
  const recommendations: string[] = [];

  // Config recommendations
  if (diagnostics.config.errors.length > 0) {
    recommendations.push('Fix Firebase configuration errors:');
    diagnostics.config.errors.forEach((error: string) => {
      recommendations.push(`  - ${error}`);
    });
  }

  // Auth recommendations
  if (diagnostics.auth.status === 'error') {
    recommendations.push('Firebase Auth Issues:');
    diagnostics.auth.recommendations?.forEach((rec: string) => {
      recommendations.push(`  - ${rec}`);
    });
  }

  // Phone Auth recommendations
  if (diagnostics.phoneAuth.status === 'warning' || diagnostics.phoneAuth.status === 'error') {
    recommendations.push('Phone Auth Setup:');
    recommendations.push('  1. Go to Firebase Console → Authentication → Sign-in method');
    recommendations.push('  2. Enable "Phone" provider');
    recommendations.push('  3. Configure reCAPTCHA settings');
    recommendations.push('  4. Set up billing for SMS (required)');
    recommendations.push('  5. Add authorized domains (localhost, moneydesk.co)');
  }

  // General recommendations
  recommendations.push('General Setup:');
  recommendations.push('  - Verify .env.local has correct Firebase config');
  recommendations.push('  - Check Firebase project is active');
  recommendations.push('  - Ensure billing is set up for SMS');
  recommendations.push('  - Test with a real phone number');

  return recommendations;
};
