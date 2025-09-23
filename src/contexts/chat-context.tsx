"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { 
  createConversation, 
  sendMessage, 
  listenToMessages, 
  getUserConversations,
  markMessagesAsRead,
  type ChatMessage, 
  type ChatConversation 
} from '@/services/chat';

interface ChatContextType {
  // State
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createNewConversation: (subject?: string, priority?: ChatConversation['priority']) => Promise<string>;
  sendNewMessage: (message: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  refreshConversations: () => Promise<void>;
  markAsRead: () => Promise<void>;
  
  // Real-time listeners
  startListening: () => void;
  stopListening: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeMessages, setUnsubscribeMessages] = useState<(() => void) | null>(null);

  // Create new conversation
  const createNewConversation = useCallback(async (
    subject?: string, 
    priority: ChatConversation['priority'] = 'medium'
  ): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create a conversation');
    }

    setLoading(true);
    setError(null);

    try {
      const conversationId = await createConversation(
        user.uid,
        user.displayName || 'User',
        user.email || '',
        subject,
        priority
      );

      // Refresh conversations to include the new one
      await refreshConversations();
      
      return conversationId;
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send new message
  const sendNewMessage = useCallback(async (message: string): Promise<void> => {
    if (!currentConversation || !user) {
      throw new Error('No active conversation or user not logged in');
    }

    setLoading(true);
    setError(null);

    try {
      await sendMessage(
        currentConversation.id,
        user.uid,
        user.displayName || 'User',
        'user',
        message
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentConversation, user]);

  // Select conversation
  const selectConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      
      // Stop listening to previous conversation
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }

      // Start listening to new conversation messages
      const unsubscribe = listenToMessages(conversationId, (newMessages) => {
        setMessages(newMessages);
      });
      setUnsubscribeMessages(() => unsubscribe);

      // Mark messages as read
      if (user) {
        markMessagesAsRead(conversationId, user.uid).catch(console.error);
      }
    }
  }, [conversations, unsubscribeMessages, user]);

  // Refresh conversations
  const refreshConversations = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userConversations = await getUserConversations(user.uid);
      setConversations(userConversations);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback(async (): Promise<void> => {
    if (!currentConversation || !user) return;

    try {
      await markMessagesAsRead(currentConversation.id, user.uid);
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [currentConversation, user]);

  // Start listening to conversations
  const startListening = useCallback(() => {
    if (!user) return;
    refreshConversations();
  }, [user]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (unsubscribeMessages) {
      unsubscribeMessages();
      setUnsubscribeMessages(null);
    }
  }, [unsubscribeMessages]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, [user, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [unsubscribeMessages]);

  const value: ChatContextType = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    createNewConversation,
    sendNewMessage,
    selectConversation,
    refreshConversations,
    markAsRead,
    startListening,
    stopListening
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
