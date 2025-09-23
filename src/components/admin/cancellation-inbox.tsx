"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusSelector } from './status-selector';
import { 
  getAllCancellationRequests, 
  updateCancellationRequestStatus, 
  deleteCancellationRequest,
  listenToCancellationRequests 
} from '@/services/cancellation-requests';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Trash2, 
  User, 
  Calendar,
  AlertCircle,
  Loader2,
  Phone
} from 'lucide-react';
import type { CancellationRequest } from '@/types';

export function CancellationInbox() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'RETAINED' | 'CANCELLED' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    // Set up real-time listener
    const unsubscribe = listenToCancellationRequests((newRequests) => {
      setRequests(newRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (requestId: string, status: CancellationRequest['status'], notes?: string) => {
    setActionLoading(true);
    try {
      await updateCancellationRequestStatus(requestId, status, 'admin', notes || adminNotes);
      setAdminNotes('');
      setIsDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this cancellation request?')) return;
    
    setActionLoading(true);
    try {
      await deleteCancellationRequest(requestId);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError('Failed to delete request');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: CancellationRequest['status']) => {
    // Handle old status values migration
    const migratedStatus = (() => {
      switch (status) {
        case 'IN_REVIEW':
          return 'IN_PROGRESS';
        case 'RESOLVED':
          return 'RETAINED';
        case 'REJECTED':
          return 'CANCELLED';
        default:
          return status;
      }
    })();
    
    const variants = {
      NEW: { variant: 'destructive' as const, icon: Clock, text: 'New', color: 'bg-red-100 text-red-800 border-red-200' },
      IN_PROGRESS: { variant: 'default' as const, icon: MessageSquare, text: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      RETAINED: { variant: 'secondary' as const, icon: CheckCircle, text: 'Retained', color: 'bg-green-100 text-green-800 border-green-200' },
      CANCELLED: { variant: 'outline' as const, icon: XCircle, text: 'Cancelled', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    // Fallback for unknown statuses
    const defaultConfig = { variant: 'outline' as const, icon: AlertCircle, text: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    const config = variants[migratedStatus] || defaultConfig;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Filter and sort requests
  const filteredAndSortedRequests = requests
    .filter(request => {
      // Handle old status values in filtering
      const migratedStatus = (() => {
        switch (request.status) {
          case 'IN_REVIEW':
            return 'IN_PROGRESS';
          case 'RESOLVED':
            return 'RETAINED';
          case 'REJECTED':
            return 'CANCELLED';
          default:
            return request.status;
        }
      })();
      
      return statusFilter === 'ALL' || 
        request.status === statusFilter || 
        migratedStatus === statusFilter;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
        case 'updatedAt':
          aValue = new Date(a[sortBy]).getTime();
          bValue = new Date(b[sortBy]).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const pendingCount = requests.filter(r => r.status === 'NEW').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading cancellation requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Cancellation Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} Pending
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage user cancellation requests and follow up with customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Filter by Status:</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="ALL">All ({requests.length})</option>
                <option value="NEW">New ({requests.filter(r => r.status === 'NEW').length})</option>
                <option value="IN_PROGRESS">In Progress ({requests.filter(r => r.status === 'IN_PROGRESS' || r.status === 'IN_REVIEW').length})</option>
                <option value="RETAINED">Retained ({requests.filter(r => r.status === 'RETAINED' || r.status === 'RESOLVED').length})</option>
                <option value="CANCELLED">Cancelled ({requests.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED').length})</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by">Sort by:</Label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-order">Order:</Label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {filteredAndSortedRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cancellation requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">{request.name}</span>
                          <span className="text-gray-500">({request.email})</span>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created: {formatDate(request.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Updated: {formatDate(request.updatedAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3 font-sans">
                          <strong>Reason:</strong> {request.reason.length > 100 
                            ? `${request.reason.substring(0, 100)}...` 
                            : request.reason}
                        </p>
                        
                        {request.adminNotes && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 font-sans">Admin Notes:</p>
                            <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans max-h-16 overflow-y-auto">
                              {request.adminNotes.length > 100 
                                ? `${request.adminNotes.substring(0, 100)}...` 
                                : request.adminNotes}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {/* Status Change Selector */}
                        <StatusSelector
                          value={request.status}
                          onChange={(newStatus) => handleStatusUpdate(request.id, newStatus)}
                          disabled={actionLoading}
                          className="min-w-[140px]"
                        />
                        
                        {/* Add Notes Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.adminNotes || '');
                            setIsDialogOpen(true);
                          }}
                          disabled={actionLoading}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Add Notes
                        </Button>
                        
                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRequest(request.id)}
                          disabled={actionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Request</DialogTitle>
            <DialogDescription>
              Change the status and add admin notes for this cancellation request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <StatusSelector
                value={selectedRequest?.status || 'NEW'}
                onChange={(newStatus) => {
                  if (selectedRequest) {
                    setSelectedRequest({
                      ...selectedRequest,
                      status: newStatus
                    });
                  }
                }}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about your interaction with the user..."
                rows={4}
                className="font-sans"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setAdminNotes('');
                setSelectedRequest(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={() => {
                if (selectedRequest) {
                  handleStatusUpdate(selectedRequest.id, selectedRequest.status, adminNotes);
                  setAdminNotes(''); // Clear the textarea after saving
                }
              }}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Update Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cancellation Request Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this cancellation request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600 font-sans">Name</Label>
                  <p className="text-lg font-medium font-sans">{selectedRequest.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 font-sans">Email</Label>
                  <p className="text-lg font-sans">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 font-sans">Phone</Label>
                  <p className="text-lg font-sans">{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 font-sans">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600 font-sans">Created At</Label>
                  <p className="text-sm text-gray-700 font-sans">{formatFullDate(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600 font-sans">Last Updated</Label>
                  <p className="text-sm text-gray-700 font-sans">{formatFullDate(selectedRequest.updatedAt)}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-sm font-semibold text-gray-600 font-sans">Reason for Cancellation</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap font-sans">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4 border-t">
                {/* Status Change */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold font-sans">Change Status</Label>
                  <StatusSelector
                    value={selectedRequest.status}
                    onChange={(newStatus) => handleStatusUpdate(selectedRequest.id, newStatus)}
                    disabled={actionLoading}
                    className="w-full"
                  />
                </div>
                
                {/* Add Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold font-sans">Add Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    rows={3}
                    className="w-full font-sans"
                  />
                  <Button
                    onClick={() => {
                      if (adminNotes.trim()) {
                        handleStatusUpdate(selectedRequest.id, selectedRequest.status, adminNotes);
                        setAdminNotes(''); // Clear the textarea after saving
                      }
                    }}
                    disabled={actionLoading || !adminNotes.trim()}
                    size="sm"
                    className="w-full"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Save Notes
                  </Button>
                </div>
                
                {/* Delete Action */}
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteRequest(selectedRequest.id)}
                  disabled={actionLoading}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Request
                </Button>
              </div>

              {/* Admin Notes History */}
              <div>
                <Label className="text-sm font-semibold text-gray-600 font-sans">Admin Notes History</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {selectedRequest.adminNotes ? (
                    <div className="text-sm whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                      {selectedRequest.adminNotes}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic font-sans">No admin notes yet</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div>
                <Label className="text-sm font-semibold text-gray-600 font-sans">Technical Details</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 gap-2 text-xs font-sans">
                    <div><strong>User ID:</strong> {selectedRequest.userId}</div>
                    <div><strong>Request ID:</strong> {selectedRequest.id}</div>
                    <div><strong>Source:</strong> {selectedRequest.metadata.source}</div>
                    <div><strong>User Agent:</strong> {selectedRequest.metadata.userAgent}</div>
                    <div><strong>IP Address:</strong> {selectedRequest.metadata.ip}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
