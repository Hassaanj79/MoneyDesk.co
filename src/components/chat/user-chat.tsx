"use client";

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/chat-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Clock, 
  User, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserChatProps {
  className?: string;
}

export function UserChat({ className }: UserChatProps) {
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    createNewConversation,
    sendNewMessage,
    selectConversation,
    refreshConversations
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationSubject, setNewConversationSubject] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !currentConversation) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, currentConversation, selectConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendNewMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConversationSubject.trim()) return;

    try {
      await createNewConversation(newConversationSubject.trim());
      setShowNewConversation(false);
      setNewConversationSubject('');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-sans">Support Chat</h2>
        </div>
        <Button
          onClick={() => setShowNewConversation(true)}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600 font-sans">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans">Your Conversations</CardTitle>
            <CardDescription className="text-xs font-sans">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 font-sans">
                No conversations yet
              </p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    currentConversation?.id === conversation.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium font-sans truncate">
                        {conversation.subject || 'General Inquiry'}
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusColor(conversation.status))}
                      >
                        {conversation.status}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPriorityColor(conversation.priority))}
                      >
                        {conversation.priority}
                      </Badge>
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate font-sans">
                        {conversation.lastMessage}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-sans">
                      {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : 'No messages'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-sans">
                  {currentConversation?.subject || 'Select a conversation'}
                </CardTitle>
                <CardDescription className="text-xs font-sans">
                  {currentConversation ? (
                    <>
                      Status: <span className="capitalize">{currentConversation.status}</span>
                      {' • '}
                      Priority: <span className="capitalize">{currentConversation.priority}</span>
                    </>
                  ) : (
                    'Choose a conversation to start chatting'
                  )}
                </CardDescription>
              </div>
              {currentConversation && (
                <Button
                  onClick={refreshConversations}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-64 overflow-y-auto space-y-3">
              {currentConversation ? (
                messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-sans">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.senderType === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.senderType === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium font-sans">
                            {message.senderName}
                          </span>
                          <span className="text-xs opacity-70 font-sans">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-sans whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-sans">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {currentConversation && (
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] font-sans"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Conversation Dialog */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg font-sans">Start New Conversation</CardTitle>
              <CardDescription className="font-sans">
                What can we help you with today?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateConversation} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium font-sans">Subject</label>
                  <Input
                    value={newConversationSubject}
                    onChange={(e) => setNewConversationSubject(e.target.value)}
                    placeholder="e.g., Account issue, Billing question..."
                    className="font-sans"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewConversation(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!newConversationSubject.trim()}>
                    Start Chat
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
