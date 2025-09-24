import { auth } from '@/lib/firebase';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdToken,
  onIdTokenChanged
} from 'firebase/auth';

class FirebaseAuthService {
  private tokenRefreshInterval: NodeJS.Timeout | null = null;
  private lastTokenRefresh: number = 0;
  private readonly TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

  constructor() {
    this.setupTokenRefresh();
    this.setupTimezoneChangeListener();
  }

  private setupTokenRefresh() {
    // Listen for token changes
    onIdTokenChanged(auth, async (user) => {
      if (user) {
        this.lastTokenRefresh = Date.now();
        console.log('Firebase token refreshed automatically');
      }
    });
  }

  private setupTimezoneChangeListener() {
    // Listen for timezone changes
    let lastTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const checkTimezoneChange = () => {
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (currentTimezone !== lastTimezone) {
        console.log('Timezone changed from', lastTimezone, 'to', currentTimezone);
        lastTimezone = currentTimezone;
        this.handleTimezoneChange();
      }
    };

    // Check every 30 seconds for timezone changes
    setInterval(checkTimezoneChange, 30000);
  }

  private async handleTimezoneChange() {
    const user = auth.currentUser;
    if (user) {
      try {
        console.log('Refreshing Firebase token due to timezone change...');
        await this.refreshToken();
        console.log('Token refreshed successfully after timezone change');
      } catch (error) {
        console.error('Failed to refresh token after timezone change:', error);
        // If token refresh fails, try to re-authenticate
        this.handleAuthFailure();
      }
    }
  }

  public async refreshToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user to refresh token for');
      return null;
    }

    try {
      // Force token refresh
      const token = await getIdToken(user, true);
      this.lastTokenRefresh = Date.now();
      console.log('Token refreshed successfully');
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  public async ensureValidToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    // Check if token needs refresh (every 50 minutes or if never refreshed)
    const now = Date.now();
    const needsRefresh = !this.lastTokenRefresh || 
                        (now - this.lastTokenRefresh) > this.TOKEN_REFRESH_INTERVAL;

    if (needsRefresh) {
      try {
        return await this.refreshToken();
      } catch (error) {
        console.error('Failed to ensure valid token:', error);
        return null;
      }
    }

    // Return current token
    try {
      return await getIdToken(user);
    } catch (error) {
      console.error('Failed to get current token:', error);
      return null;
    }
  }

  private handleAuthFailure() {
    console.log('Handling authentication failure...');
    // Clear any stored auth state
    localStorage.removeItem('firebase:authUser');
    // Optionally redirect to login
    // window.location.href = '/login';
  }

  public async signOut(): Promise<void> {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
    await firebaseSignOut(auth);
  }

  // Method to manually trigger token refresh (useful for debugging)
  public async forceTokenRefresh(): Promise<string | null> {
    console.log('Manually forcing token refresh...');
    return await this.refreshToken();
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
