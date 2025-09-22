// Authentication configuration for Firebase Dynamic Links deprecation
// Web app only configuration

export const AUTH_CONFIG = {
  // Your app's domain for email links
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000',
};

// Helper function to create action code settings for web app
export const createActionCodeSettings = (url: string) => ({
  url,
  handleCodeInApp: true,
  // Web app only - no mobile app configuration needed
  // Remove dynamic link domain to avoid Firebase Dynamic Links
  dynamicLinkDomain: undefined,
});

// Helper function to create unified auth action URL
export const createAuthActionUrl = (email: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
  const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${baseUrl}/auth-action?email=${encodeURIComponent(email)}`;
};

// Legacy functions for backward compatibility
export const createPasswordResetUrl = createAuthActionUrl;
export const createEmailVerificationUrl = createAuthActionUrl;
