"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createCancellationRequest } from "@/services/cancellation-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageSquare, CheckCircle, XCircle } from "lucide-react";

interface ExitSurveyData {
  name: string;
  email: string;
  reason: string;
}

interface ExitSurveyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithDeletion: () => void;
}

export function ExitSurveyForm({ isOpen, onClose, onProceedWithDeletion }: ExitSurveyFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExitSurveyData>({
    name: user?.displayName || '',
    email: user?.email || '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof ExitSurveyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.reason) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send exit survey data to admin
      await sendExitSurveyToAdmin(formData);
      setSuccess(true);
      
      // Wait a moment to show success message, then proceed with deletion
      setTimeout(() => {
        onProceedWithDeletion();
      }, 2000);
    } catch (err: any) {
      console.error('Error sending exit survey:', err);
      setError("Failed to submit survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendExitSurveyToAdmin = async (data: ExitSurveyData) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }
    
    // Save cancellation request to database
    await createCancellationRequest({
      userId: user.uid,
      name: data.name,
      email: data.email,
      phone: '', // Phone will be collected in the new form
      reason: data.reason,
      status: 'NEW',
      metadata: {
        userAgent: navigator.userAgent,
        ip: 'client-side',
        source: 'web'
      }
    });
  };

  const handleClose = () => {
    if (!loading && !success) {
      setFormData({
        name: user?.displayName || '',
        email: user?.email || '',
        reason: ''
      });
      setError(null);
      onClose();
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Survey Submitted
            </DialogTitle>
            <DialogDescription>
              Thank you for your feedback! Our team will reach out to you shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your account will be deleted in a moment. We appreciate your time with MoneyDesk.co!
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-orange-600 dark:text-orange-400 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            We're Sorry to See You Go
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing why you're canceling your account. Our team will reach out to you shortly.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Canceling</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please tell us why you're canceling your account. Your feedback helps us improve our service."
              rows={4}
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              disabled={loading || !formData.name || !formData.email || !formData.reason}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit & Cancel Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
