'use client';

import AppLayout from '@/components/app-layout';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to login if authentication is initialized and no user
    if (!loading && !user) {
      try {
        router.push('/login');
      } catch (error) {
        console.error('Error redirecting to login:', error);
      }
    }
    // If user exists but email is not verified, force verification flow
    if (!loading && user && !user.emailVerified) {
      try {
        const emailParam = encodeURIComponent(user.email || '');
        // Avoid redirect loops: if already on verify-email, do nothing
        const current = window.location.pathname;
        if (!current.startsWith('/verify-email')) {
          router.push(`/verify-email?email=${emailParam}`);
        }
      } catch (error) {
        console.error('Error redirecting to verify email:', error);
      }
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Authentication Required</p>
          <p className="text-sm text-muted-foreground mb-4">Please log in to access this page.</p>
          <button
            onClick={() => {
              try {
                router.push('/login');
              } catch (error) {
                console.error('Error navigating to login:', error);
                window.location.href = '/login';
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Block unverified users from seeing app content
  if (user && !user.emailVerified) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Verify your email</p>
          <p className="text-sm text-muted-foreground">We sent a verification link to your email. Please verify to continue.</p>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}