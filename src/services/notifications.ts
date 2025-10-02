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
import type { Notification } from '@/types';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Create a notification
export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Notification['data'],
  priority: Notification['priority'] = 'medium',
  expiresInHours?: number
): Promise<string> => {
  try {
    const notificationData = {
      userId,
      type,
      title,
      message,
      isRead: false,
      data: data || {},
      priority,
      createdAt: serverTimestamp(),
      ...(expiresInHours && {
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      })
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(notificationsQuery);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt || null
    })) as Notification[];

    // Filter out expired notifications
    const now = new Date();
    const validNotifications = notifications.filter(notification => 
      !notification.expiresAt || new Date(notification.expiresAt) > now
    );

    // Sort by creation date (newest first)
    return validNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Get all notifications for admin
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION)
    );

    const querySnapshot = await getDocs(notificationsQuery);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt || null
    })) as Notification[];

    // Filter out expired notifications
    const now = new Date();
    const validNotifications = notifications.filter(notification => 
      !notification.expiresAt || new Date(notification.expiresAt) > now
    );

    // Sort by creation date (newest first)
    return validNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting all notifications:', error);
    throw error;
  }
};

// Listen to notifications in real-time for a user
export const listenToUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  onError?: (error: any) => void
) => {
  const notificationsQuery = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(notificationsQuery, 
    (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: doc.data().expiresAt || null
      })) as Notification[];

      // Filter out expired notifications
      const now = new Date();
      const validNotifications = notifications.filter(notification => 
        !notification.expiresAt || new Date(notification.expiresAt) > now
      );

      // Sort by creation date (newest first)
      const sortedNotifications = validNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(sortedNotifications);
    },
    (error) => {
      console.error('Error listening to user notifications:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};

// Listen to all notifications in real-time for admin
export const listenToAllNotifications = (callback: (notifications: Notification[]) => void) => {
  const notificationsQuery = query(
    collection(db, NOTIFICATIONS_COLLECTION)
  );

  return onSnapshot(notificationsQuery, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt || null
    })) as Notification[];

    // Filter out expired notifications
    const now = new Date();
    const validNotifications = notifications.filter(notification => 
      !notification.expiresAt || new Date(notification.expiresAt) > now
    );

    // Sort by creation date (newest first)
    const sortedNotifications = validNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(sortedNotifications);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, { isRead: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(notificationsQuery);
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete expired notifications
export const deleteExpiredNotifications = async (): Promise<void> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION)
    );

    const querySnapshot = await getDocs(notificationsQuery);
    const now = new Date();
    const deletePromises = querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.expiresAt && new Date(data.expiresAt) <= now;
      })
      .map(doc => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting expired notifications:', error);
    throw error;
  }
};

// Notification helper functions
export const createChatReplyNotification = async (
  userId: string,
  conversationId: string,
  adminName: string
): Promise<string> => {
  return createNotification(
    userId,
    'chat_reply',
    'New Reply from Support',
    `${adminName} replied to your support conversation`,
    { conversationId },
    'medium',
    24 // Expires in 24 hours
  );
};

export const createCancellationRequestNotification = async (
  adminId: string,
  cancellationRequestId: string,
  userName: string
): Promise<string> => {
  return createNotification(
    adminId,
    'cancellation_request',
    'New Cancellation Request',
    `${userName} has requested account cancellation`,
    { cancellationRequestId },
    'high',
    72 // Expires in 72 hours
  );
};

export const createSupportTicketNotification = async (
  adminId: string,
  conversationId: string,
  userName: string,
  subject: string
): Promise<string> => {
  return createNotification(
    adminId,
    'admin_alert',
    'New Support Ticket',
    `${userName} created a new support ticket: ${subject}`,
    { conversationId },
    'medium',
    48 // Expires in 48 hours
  );
};
