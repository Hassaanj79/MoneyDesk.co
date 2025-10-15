"use client";

import React, { useState } from 'react';
import { useDraftTransactions } from '@/contexts/draft-transaction-context';
import { useTranslation } from '@/hooks/use-translation';
import { useCurrency } from '@/hooks/use-currency';
import { DraftTransaction } from '@/types';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  AlertCircle
} from 'lucide-react';

export default function DraftTransactionsPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { 
    pendingDrafts, 
    loading, 
    error, 
    approveDraft, 
    rejectDraft, 
    deleteDraft,
    updateDraft 
  } = useDraftTransactions();

  const [editingDraft, setEditingDraft] = useState<DraftTransaction | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  const handleApprove = async (id: string) => {
    try {
      await approveDraft(id);
    } catch (error) {
      console.error('Error approving draft:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectDraft(id);
    } catch (error) {
      console.error('Error rejecting draft:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this draft transaction?')) {
      try {
        await deleteDraft(id);
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }
  };

  const handleEdit = (draft: DraftTransaction) => {
    setEditingDraft(draft);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'recurring':
        return 'Recurring Transaction';
      case 'loan_installment':
        return 'Loan Installment';
      case 'manual':
        return 'Manual Draft';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading draft transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Drafts</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Draft Transactions</h1>
          <p className="mt-2 text-gray-600">
            Review and approve auto-generated transactions from recurring payments and loan installments.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingDrafts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(pendingDrafts.reduce((sum, draft) => sum + draft.amount, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Generated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingDrafts.filter(d => d.autoGenerated).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Draft Transactions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Draft Transactions</h2>
          </div>
          
          {pendingDrafts.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Drafts</h3>
              <p className="text-gray-600">All draft transactions have been reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingDrafts.map((draft) => (
                <div key={draft.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(draft.status)}
                        <h3 className="text-lg font-medium text-gray-900">{draft.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(draft.status)}`}>
                          {draft.status}
                        </span>
                        {draft.autoGenerated && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Auto-Generated
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="font-medium">{formatCurrency(draft.amount)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{format(new Date(draft.date), 'MMM dd, yyyy')}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 mr-2" />
                          <span className="capitalize">{draft.type}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          <span>{getSourceTypeLabel(draft.sourceType)}</span>
                        </div>
                      </div>
                      
                      {draft.notes && (
                        <p className="mt-2 text-sm text-gray-600">{draft.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(draft.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      
                      <button
                        onClick={() => handleReject(draft.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                      
                      <button
                        onClick={() => handleEdit(draft)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDelete(draft.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

