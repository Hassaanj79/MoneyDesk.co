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
import type { ChatMessage, ChatConversation } from '@/types';
import { createChatReplyNotification, createSupportTicketNotification } from './notifications';

const CONVERSATIONS_COLLECTION = 'chat_conversations';
const MESSAGES_COLLECTION = 'chat_messages';

// Create a new conversation
export const createConversation = async (
  userId: string,
  userName: string,
  userEmail: string,
  subject?: string,
  priority: ChatConversation['priority'] = 'medium'
): Promise<string> => {
  try {
    const conversationData = {
      userId,
      userName,
      userEmail,
      status: 'active' as const,
      priority,
      subject: subject || 'General Inquiry',
      unreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        ip: 'client-side',
        source: 'web' as const
      }
    };

    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  senderType: 'user' | 'admin',
  message: string
): Promise<string> => {
  try {
    // Get conversation to find the userId
    const conversationDoc = await getDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
    const conversationData = conversationDoc.data();
    
    const messageData = {
      conversationId,
      senderId,
      senderName,
      senderType,
      message,
      userId: conversationData?.userId || senderId, // Add userId for permission checking
      timestamp: serverTimestamp(),
      isRead: false,
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        ip: 'client-side'
      }
    };

    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);
    
    // Update conversation with last message info
    await updateConversation(conversationId, {
      lastMessage: message,
      lastMessageAt: new Date().toISOString(),
      unreadCount: senderType === 'user' ? 1 : 0 // Only increment for user messages
    });

    // Create notification for admin when user sends message
    if (senderType === 'user') {
      try {
        // Get conversation details to find admin
        const conversationDoc = await getDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
        const conversationData = conversationDoc.data();
        
        if (conversationData?.assignedAdminId) {
          await createChatReplyNotification(
            conversationData.assignedAdminId,
            conversationId,
            senderName
          );
        } else {
          // If no assigned admin, create a general admin notification
          await createSupportTicketNotification(
            'admin', // This should be replaced with actual admin ID
            conversationId,
            senderName,
            conversationData?.subject || 'General Inquiry'
          );
        }
      } catch (notificationError) {
        console.error('Failed to create chat notification:', notificationError);
        // Don't throw here as the message was sent successfully
      }
    }

    // Create notification for user when admin sends message
    if (senderType === 'admin') {
      try {
        // Get conversation details to find user
        const conversationDoc = await getDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
        const conversationData = conversationDoc.data();
        
        if (conversationData?.userId) {
          await createChatReplyNotification(
            conversationData.userId,
            conversationId,
            senderName
          );
        }
      } catch (notificationError) {
        console.error('Failed to create chat notification:', notificationError);
        // Don't throw here as the message was sent successfully
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
    const messagesQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId)
    );

    const querySnapshot = await getDocs(messagesQuery);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
    })) as ChatMessage[];

    // Sort in memory to avoid index requirement
    return messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

// Listen to messages in real-time
export const listenToMessages = (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  console.log('🔍 Setting up message listener for conversation:', conversationId);
  
  const messagesQuery = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(messagesQuery, (querySnapshot) => {
    console.log('📨 Received message update:', {
      conversationId,
      docCount: querySnapshot.docs.length,
      hasError: querySnapshot.metadata.hasPendingWrites
    });
    
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📝 Message data:', {
        id: doc.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        userId: data.userId,
        senderType: data.senderType,
        message: data.message?.substring(0, 30) + '...'
      });
      
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    }) as ChatMessage[];

    // Sort in memory to avoid index requirement
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    console.log('📤 Sending sorted messages to callback:', sortedMessages.length);
    callback(sortedMessages);
  }, (error) => {
    console.error('❌ Error in message listener:', error);
  });
};

// Get conversations for a user
export const getUserConversations = async (userId: string): Promise<ChatConversation[]> => {
  try {
    const conversationsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(conversationsQuery);
    const conversations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastMessageAt: doc.data().lastMessageAt || null
    })) as ChatConversation[];

    // Sort in memory to avoid index requirement
    return conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

// Get all conversations for admin
export const getAllConversations = async (): Promise<ChatConversation[]> => {
  try {
    const conversationsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION)
    );

    const querySnapshot = await getDocs(conversationsQuery);
    const conversations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastMessageAt: doc.data().lastMessageAt || null
    })) as ChatConversation[];

    // Sort in memory to avoid index requirement
    return conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting all conversations:', error);
    throw error;
  }
};

// Listen to conversations in real-time for admin
export const listenToAllConversations = (callback: (conversations: ChatConversation[]) => void) => {
  const conversationsQuery = query(
    collection(db, CONVERSATIONS_COLLECTION)
  );

  return onSnapshot(conversationsQuery, (querySnapshot) => {
    const conversations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastMessageAt: doc.data().lastMessageAt || null
    })) as ChatConversation[];

    // Sort in memory to avoid index requirement
    const sortedConversations = conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    callback(sortedConversations);
  });
};

// Update conversation
export const updateConversation = async (
  conversationId: string,
  updates: Partial<ChatConversation>
): Promise<void> => {
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    const messagesQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId)
    );

    const querySnapshot = await getDocs(messagesQuery);
    const updatePromises = querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.senderId !== userId && data.isRead === false;
      })
      .map(doc => updateDoc(doc.ref, { isRead: true }));

    await Promise.all(updatePromises);

    // Reset unread count for the conversation
    await updateConversation(conversationId, { unreadCount: 0 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Assign conversation to admin
export const assignConversation = async (
  conversationId: string,
  adminId: string,
  adminName: string
): Promise<void> => {
  try {
    await updateConversation(conversationId, {
      assignedAdminId: adminId,
      assignedAdminName: adminName
    });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    throw error;
  }
};

// Close conversation
export const closeConversation = async (conversationId: string): Promise<void> => {
  try {
    await updateConversation(conversationId, {
      status: 'closed'
    });
  } catch (error) {
    console.error('Error closing conversation:', error);
    throw error;
  }
};

// Resolve conversation
export const resolveConversation = async (conversationId: string): Promise<void> => {
  try {
    await updateConversation(conversationId, {
      status: 'resolved'
    });
  } catch (error) {
    console.error('Error resolving conversation:', error);
    throw error;
  }
};
