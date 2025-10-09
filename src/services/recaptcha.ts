// reCAPTCHA Service
// This service handles reCAPTCHA integration for login and signup

export interface RecaptchaConfig {
  siteKey: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  type?: 'image' | 'audio';
}

export interface RecaptchaResult {
  success: boolean;
  token?: string;
  error?: string;
}

// Your reCAPTCHA site key
const RECAPTCHA_SITE_KEY = '6Lcdl-IrAAAAAJgH-_hLhYabq387rGlLgNomhb4r';

/**
 * Load reCAPTCHA script if not already loaded
 */
export const loadRecaptchaScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if reCAPTCHA is already loaded
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="recaptcha"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')));
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Execute reCAPTCHA and get token
 */
export const executeRecaptcha = async (action: string = 'submit'): Promise<RecaptchaResult> => {
  try {
    // Load reCAPTCHA script if needed
    await loadRecaptchaScript();

    // Wait for grecaptcha to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!(window as any).grecaptcha && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!(window as any).grecaptcha) {
      return {
        success: false,
        error: 'reCAPTCHA not available. Please refresh the page and try again.'
      };
    }

    // Execute reCAPTCHA
    const token = await (window as any).grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    
    if (!token) {
      return {
        success: false,
        error: 'Failed to get reCAPTCHA token. Please try again.'
      };
    }

    return {
      success: true,
      token
    };

  } catch (error: any) {
    console.error('reCAPTCHA execution error:', error);
    return {
      success: false,
      error: error.message || 'reCAPTCHA verification failed'
    };
  }
};

/**
 * Verify reCAPTCHA token on server side
 * Note: This would typically be done on your backend
 */
export const verifyRecaptchaToken = async (token: string): Promise<boolean> => {
  try {
    // This should be done on your backend for security
    // For now, we'll just validate the token format
    if (!token || token.length < 10) {
      return false;
    }

    // In a real implementation, you would send this to your backend
    // which would then verify with Google's reCAPTCHA API
    console.log('reCAPTCHA token received:', token.substring(0, 20) + '...');
    
    return true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};

/**
 * Create a reCAPTCHA widget (for visible reCAPTCHA)
 */
export const createRecaptchaWidget = (
  containerId: string,
  callback: (token: string) => void,
  config: Partial<RecaptchaConfig> = {}
): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      await loadRecaptchaScript();

      const widgetId = (window as any).grecaptcha.render(containerId, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: callback,
        theme: config.theme || 'light',
        size: config.size || 'normal',
        type: config.type || 'image'
      });

      resolve(widgetId);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Reset reCAPTCHA widget
 */
export const resetRecaptchaWidget = (widgetId: number): void => {
  try {
    if ((window as any).grecaptcha) {
      (window as any).grecaptcha.reset(widgetId);
    }
  } catch (error) {
    console.error('Error resetting reCAPTCHA:', error);
  }
};

/**
 * Get reCAPTCHA configuration
 */
export const getRecaptchaConfig = (): RecaptchaConfig => {
  return {
    siteKey: RECAPTCHA_SITE_KEY,
    theme: 'light',
    size: 'normal',
    type: 'image'
  };
};

/**
 * Check if reCAPTCHA is available
 */
export const isRecaptchaAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).grecaptcha;
};
