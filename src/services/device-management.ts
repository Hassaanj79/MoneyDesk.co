import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

export interface DeviceSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  location: {
    city: string;
    country: string;
    region: string;
  };
  isActive: boolean;
  isRemembered: boolean;
  lastActivity: Timestamp;
  createdAt: Timestamp;
  userAgent: string;
}

const DEVICE_SESSIONS_COLLECTION = 'device_sessions';

// Generate unique device ID
export const generateDeviceId = (): string => {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get device information from user agent
export const getDeviceInfo = (userAgent: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);
  
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  
  // Extract browser info
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Extract OS info
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Create or update device session
export const createOrUpdateDeviceSession = async (
  userId: string,
  deviceId: string,
  deviceName: string,
  userAgent: string,
  ipAddress: string,
  location: { city: string; country: string; region: string },
  isRemembered: boolean = false
): Promise<string> => {
  try {
    const { deviceType, browser, os } = getDeviceInfo(userAgent);
    
    // Check if session already exists
    const existingSessionQuery = query(
      collection(db, DEVICE_SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('deviceId', '==', deviceId)
    );
    
    const existingSessions = await getDocs(existingSessionQuery);
    
    if (!existingSessions.empty) {
      // Update existing session
      const sessionDoc = existingSessions.docs[0];
      await updateDoc(doc(db, DEVICE_SESSIONS_COLLECTION, sessionDoc.id), {
        isActive: true,
        isRemembered,
        lastActivity: serverTimestamp(),
        userAgent,
        ipAddress,
        location,
        deviceName
      });
      return sessionDoc.id;
    } else {
      // Create new session
      const sessionData = {
        userId,
        deviceId,
        deviceName,
        deviceType,
        browser,
        os,
        ipAddress,
        location,
        isActive: true,
        isRemembered,
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
        userAgent
      };
      
      const docRef = await addDoc(collection(db, DEVICE_SESSIONS_COLLECTION), sessionData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating/updating device session:', error);
    throw new Error('Failed to create device session');
  }
};

// Get user's active sessions
export const getUserActiveSessions = async (userId: string): Promise<DeviceSession[]> => {
  try {
    const sessionsQuery = query(
      collection(db, DEVICE_SESSIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(session => session.isActive === true) // Filter in memory
      .sort((a, b) => {
        const aTime = a.lastActivity?.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity?.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime; // Sort in memory
      }) as DeviceSession[];
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw new Error('Failed to fetch user sessions');
  }
};

// Get user's remembered sessions
export const getUserRememberedSessions = async (userId: string): Promise<DeviceSession[]> => {
  try {
    const sessionsQuery = query(
      collection(db, DEVICE_SESSIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(session => session.isRemembered === true && session.isActive === true) // Filter in memory
      .sort((a, b) => {
        const aTime = a.lastActivity?.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity?.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime; // Sort in memory
      }) as DeviceSession[];
  } catch (error) {
    console.error('Error fetching remembered sessions:', error);
    throw new Error('Failed to fetch remembered sessions');
  }
};

// Update session activity
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, DEVICE_SESSIONS_COLLECTION, sessionId), {
      lastActivity: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating session activity:', error);
    throw new Error('Failed to update session activity');
  }
};

// Toggle remember me for a session
export const toggleRememberMe = async (sessionId: string, isRemembered: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, DEVICE_SESSIONS_COLLECTION, sessionId), {
      isRemembered
    });
  } catch (error) {
    console.error('Error toggling remember me:', error);
    throw new Error('Failed to toggle remember me');
  }
};

// End a session (logout from device)
export const endSession = async (sessionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, DEVICE_SESSIONS_COLLECTION, sessionId), {
      isActive: false,
      lastActivity: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending session:', error);
    throw new Error('Failed to end session');
  }
};

// End all sessions for a user
export const endAllSessions = async (userId: string): Promise<void> => {
  try {
    const sessionsQuery = query(
      collection(db, DEVICE_SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(sessionsQuery);
    const batch = [];
    
    snapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, {
        isActive: false,
        lastActivity: serverTimestamp()
      }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error ending all sessions:', error);
    throw new Error('Failed to end all sessions');
  }
};

// Get session count
export const getSessionCount = async (userId: string): Promise<number> => {
  try {
    const sessionsQuery = query(
      collection(db, DEVICE_SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(sessionsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting session count:', error);
    return 0;
  }
};

// Real-time listener for user sessions
export const subscribeToUserSessions = (
  userId: string,
  callback: (sessions: DeviceSession[]) => void
): (() => void) => {
  const sessionsQuery = query(
    collection(db, DEVICE_SESSIONS_COLLECTION),
    where('userId', '==', userId)
  );
  
  return onSnapshot(sessionsQuery, (snapshot) => {
    const sessions = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(session => session.isActive === true) // Filter in memory to avoid index requirement
      .sort((a, b) => {
        const aTime = a.lastActivity?.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity?.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime;
      }) as DeviceSession[];
    callback(sessions);
  });
};
