"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAdmin } from '@/contexts/admin-context';
import { 
  getAllConversations, 
  listenToAllConversations, 
  getMessages, 
  listenToMessages,
  sendMessage,
  updateConversation,
  assignConversation,
  closeConversation,
  resolveConversation,
  markMessagesAsRead,
  type ChatMessage, 
  type ChatConversation 
} from '@/services/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  User, 
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomerSupport() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      return;
    }

    const loadConversations = async () => {
      setLoading(true);
      try {
        const allConversations = await getAllConversations();
        setConversations(allConversations);
        setError(null);
      } catch (err: any) {
        console.error('Error loading conversations:', err);
        setError(err.message || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Listen to real-time updates
    const unsubscribe = listenToAllConversations((updatedConversations) => {
      setConversations(updatedConversations);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Select conversation and load messages
  const selectConversation = async (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    setCurrentConversation(conversation);
    setError(null);

    try {
      // Load messages
      const conversationMessages = await getMessages(conversationId);
      setMessages(conversationMessages);

      // Mark messages as read
      if (user) {
        await markMessagesAsRead(conversationId, user.uid);
      }

      // Listen to real-time messages
      const unsubscribe = listenToMessages(conversationId, (newMessages) => {
        setMessages(newMessages);
      });

      return unsubscribe;
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation || !user || sending || !isAdmin) return;

    setSending(true);
    try {
      await sendMessage(
        currentConversation.id,
        user.uid,
        user.displayName || 'Admin',
        'admin',
        newMessage.trim()
      );
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Update conversation status
  const handleStatusChange = async (conversationId: string, status: ChatConversation['status']) => {
    try {
      await updateConversation(conversationId, { status });
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Assign conversation
  const handleAssignConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      await assignConversation(conversationId, user.uid, user.displayName || 'Admin');
    } catch (err: any) {
      setError(err.message || 'Failed to assign conversation');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conversation.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-sans">Customer Support</h2>
        </div>
        <div className="text-sm text-muted-foreground font-sans">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600 font-sans">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans">Conversations</CardTitle>
            
            {/* Filters */}
            <div className="space-y-2">
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs font-sans"
              />
              <div className="grid grid-cols-2 gap-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 font-sans">
                No conversations found
              </p>
            ) : (
              filteredConversations.map((conversation) => (
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
                    <p className="text-xs text-muted-foreground font-sans">
                      {conversation.userName} • {conversation.userEmail}
                    </p>
                    <div className="flex items-center gap-1">
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
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-sans">
                  {currentConversation?.subject || 'Select a conversation'}
                </CardTitle>
                <CardDescription className="text-xs font-sans">
                  {currentConversation ? (
                    <>
                      {currentConversation.userName} • {currentConversation.userEmail}
                      {' • '}
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
                <div className="flex items-center gap-2">
                  <Select
                    value={currentConversation.status}
                    onValueChange={(value) => handleStatusChange(currentConversation.id, value as ChatConversation['status'])}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleAssignConversation(currentConversation.id)}
                    variant="outline"
                    size="sm"
                    disabled={currentConversation.assignedAdminId === user?.uid}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-80 overflow-y-auto space-y-3">
              {currentConversation ? (
                messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-sans">No messages yet</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.senderType === 'admin' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.senderType === 'admin'
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
                    placeholder={isAdmin ? "Type your message..." : "Admin access required"}
                    className="flex-1 min-h-[60px] font-sans"
                    disabled={sending || !isAdmin}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending || !isAdmin}
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
    </div>
  );
}
