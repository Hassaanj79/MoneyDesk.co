import { is2FAEnabled } from './email-2fa'

/**
 * Check if 2FA is required for a user after sign-in
 * This is a separate service to avoid touching existing auth code
 */
export const check2FARequired = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) {
      return false
    }
    
    // Temporarily disable 2FA to prevent app from getting stuck
    // You can re-enable this later when email system is working properly
    return false
    
    // const enabled = await is2FAEnabled(userId)
    // return enabled
  } catch (error) {
    console.error('Error checking 2FA requirement:', error)
    return false
  }
}

/**
 * Redirect to 2FA verification page if required
 * This can be called from any component without affecting existing code
 */
export const redirectTo2FAIfRequired = async (userId: string, router: any): Promise<boolean> => {
  try {
    const isRequired = await check2FARequired(userId)
    
    if (isRequired) {
      // Store a flag to indicate user needs 2FA verification
      sessionStorage.setItem('2fa_required', 'true')
      router.push('/signin-2fa')
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error checking 2FA requirement:', error)
    return false
  }
}

/**
 * Check if user has completed 2FA verification
 * This can be used to protect routes that require 2FA
 */
export const is2FAVerified = (): boolean => {
  try {
    const verified = sessionStorage.getItem('2fa_verified')
    return verified === 'true'
  } catch (error) {
    console.error('Error checking 2FA verification status:', error)
    return false
  }
}

/**
 * Mark 2FA as verified for this session
 * Call this after successful 2FA verification
 */
export const mark2FAVerified = (): void => {
  try {
    sessionStorage.setItem('2fa_verified', 'true')
    sessionStorage.removeItem('2fa_required')
  } catch (error) {
    console.error('Error marking 2FA as verified:', error)
  }
}

/**
 * Clear 2FA verification status
 * Call this on logout or when starting a new session
 */
export const clear2FAStatus = (): void => {
  try {
    sessionStorage.removeItem('2fa_verified')
    sessionStorage.removeItem('2fa_required')
  } catch (error) {
    console.error('Error clearing 2FA status:', error)
  }
}
