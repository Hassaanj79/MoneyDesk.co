"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { createCancellationRequest } from "@/services/cancellation-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, User, Mail, Phone, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

interface CancelAccountFormData {
  phone: string;
  reason: string;
}

interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

export function CancelAccountForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<CancelAccountFormData>({
    phone: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // Pre-fill phone from user profile if available
  useEffect(() => {
    if (user?.phoneNumber) {
      setFormData(prev => ({ ...prev, phone: user.phoneNumber }));
    }
  }, [user]);

  const handleInputChange = (field: keyof CancelAccountFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCountryChange = (country: Country | null) => {
    setSelectedCountry(country);
  };

  const validatePhone = (phone: string): boolean => {
    // E.164 format validation: +1234567890
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with user:', user);
    console.log('Form data:', formData);
    
    if (!user?.uid) {
      setError("You must be logged in to submit a cancellation request.");
      return;
    }
    
    if (!user?.displayName) {
      setError("User name not available. Please update your profile first.");
      return;
    }
    
    if (!user?.email) {
      setError("User email not available. Please update your profile first.");
      return;
    }

    // Validation
    if (!formData.phone.trim()) {
      setError("Contact number is required");
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid contact number in international format (e.g., +1234567890)");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please describe how we can help you");
      return;
    }

    if (formData.reason.trim().length < 10) {
      setError("Please provide more details (at least 10 characters)");
      return;
    }

    if (formData.reason.trim().length > 2000) {
      setError("Message must be less than 2000 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user agent and IP (simplified for client-side)
      const userAgent = navigator.userAgent;
      const source = 'web'; // Since this is a web app
      
      console.log('Creating cancellation request with data:', {
        userId: user.uid,
        name: user.displayName,
        email: user.email,
        phone: formData.phone.trim(),
        reason: formData.reason.trim(),
        status: 'NEW',
        metadata: {
          userAgent,
          ip: 'client-side',
          source
        }
      });
      
      // Create cancellation request
      const requestId = await createCancellationRequest({
        userId: user.uid,
        name: user.displayName,
        email: user.email,
        phone: formData.phone.trim(),
        reason: formData.reason.trim(),
        status: 'NEW',
        metadata: {
          userAgent,
          ip: 'client-side', // In production, this would be server-side
          source
        }
      });

      console.log('Cancellation request created successfully with ID:', requestId);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error creating cancellation request:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      setError(`Failed to submit request: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccess(false);
    router.push('/settings');
  };

  if (success) {
    return (
      <Dialog open={success} onOpenChange={handleSuccessClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 dark:text-green-400 flex items-center font-sans">
              <CheckCircle className="mr-2 h-5 w-5" />
              Message sent
            </DialogTitle>
            <DialogDescription className="font-sans">
              Thank you for reaching out! We've received your message and will get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSuccessClose} className="w-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center font-sans">
          <MessageSquare className="mr-2 h-5 w-5" />
          Account Support
        </CardTitle>
        <CardDescription className="font-sans">
          Need help with your account? We're here to assist you with any questions or concerns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name - Read-only, pre-filled */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 font-sans">
              <User className="h-4 w-4" />
              Name
            </Label>
            <Input
              id="name"
              value={user?.displayName || ''}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500">This information is from your profile</p>
          </div>

          {/* Email - Read-only, pre-filled */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 font-sans">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500">This information is from your profile</p>
          </div>

          {/* Phone - Required, editable with country detection */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 font-sans">
              <Phone className="h-4 w-4" />
              Contact number *
            </Label>
            <PhoneInput
              id="phone"
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              onCountryChange={handleCountryChange}
              placeholder="Enter phone number"
              className=""
              required
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Country will be auto-detected from number</span>
              {selectedCountry && (
                <span className="text-green-600 dark:text-green-400">
                  {selectedCountry.flag} {selectedCountry.name}
                </span>
              )}
            </div>
          </div>

          {/* Reason - Required textarea */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-2 font-sans">
              <MessageSquare className="h-4 w-4" />
              How can we help? *
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please describe your question or concern, and we'll get back to you as soon as possible."
              rows={4}
              className="border-input focus:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-1 font-sans"
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 10 characters</span>
              <span>{formData.reason.length}/2000</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 focus:ring-1 focus:ring-primary focus:ring-offset-1 font-sans"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending message...
              </>
            ) : (
              'Send message'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
