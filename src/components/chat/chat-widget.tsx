"use client";

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/chat-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
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

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationSubject, setNewConversationSubject] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'conversation'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);


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
      setCurrentView('conversation');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setCurrentView('conversation');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    selectConversation(null);
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

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <>
      {/* Floating Chat Button */}
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96">
          <Card className="h-full flex flex-col shadow-2xl border-2">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentView === 'conversation' && (
                    <Button
                      onClick={handleBackToList}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 mr-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                  )}
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-sans">
                    {currentView === 'conversation' ? currentConversation?.subject || 'Support Chat' : 'Support Chat'}
                  </CardTitle>
                  {totalUnreadCount > 0 && currentView === 'list' && (
                    <Badge variant="destructive" className="text-xs">
                      {totalUnreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setIsMinimized(!isMinimized)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="flex-1 flex flex-col p-3 space-y-3">
                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <span className="text-red-600 font-sans">{error}</span>
                  </div>
                )}

                {/* Conversations List - Show when in list view */}
                {currentView === 'list' && (
                  <div className="flex-1 min-h-0">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {loading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2 font-sans">
                          No conversations yet
                        </p>
                      ) : (
                        conversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation.id)}
                            className={cn(
                              "p-2 rounded border cursor-pointer transition-colors text-xs",
                              currentConversation?.id === conversation.id
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent"
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium font-sans truncate">
                                  {conversation.subject || 'General Inquiry'}
                                </h4>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs h-4 px-1">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs h-4 px-1", getStatusColor(conversation.status))}
                                >
                                  {conversation.status}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs h-4 px-1", getPriorityColor(conversation.priority))}
                                >
                                  {conversation.priority}
                                </Badge>
                              </div>
                              {conversation.lastMessage && (
                                <p className="text-xs text-muted-foreground truncate font-sans">
                                  {conversation.lastMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Messages - Show when in conversation view */}
                {currentView === 'conversation' && (
                  <div className="flex-1 min-h-0">
                    <div className="h-32 overflow-y-auto space-y-2">
                      {currentConversation ? (
                        messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-50" />
                              <p className="text-xs font-sans">No messages yet</p>
                            </div>
                          </div>
                        ) : (
                          messages.slice(-8).map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex",
                                message.senderType === 'user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[80%] rounded p-2 text-xs",
                                  message.senderType === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                <p className="font-sans whitespace-pre-wrap">
                                  {message.message}
                                </p>
                                <p className="text-xs opacity-70 mt-1 font-sans">
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            <p className="text-xs font-sans">Select a conversation</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}

                {/* Message Input - Show when in conversation view */}
                {currentView === 'conversation' && currentConversation && (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <div className="flex gap-1">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[60px] text-xs font-sans resize-none"
                        disabled={sending}
                        rows={2}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                        className="self-end"
                      >
                        {sending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* New Conversation Button - Show when in list view */}
                {currentView === 'list' && (
                  <Button
                    onClick={() => setShowNewConversation(true)}
                    size="sm"
                    className="w-full text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Start New Chat
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

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
    </>
  );
}
