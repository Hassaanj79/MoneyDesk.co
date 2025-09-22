"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  module: string;
  requiredAccess?: string;
  showBackButton?: boolean;
}

export function AccessDenied({ 
  module, 
  requiredAccess = "access to this module",
  showBackButton = true 
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Access Restricted</CardTitle>
          <CardDescription>
            You don't have {requiredAccess}.
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Module: <span className="font-mono">{module}</span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Contact your administrator to request access.</p>
            <p className="text-xs mt-2">
              If you believe this is an error, please try refreshing the page.
            </p>
          </div>
          {showBackButton && (
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => router.back()}
                variant="outline"
              >
                Go Back
              </Button>
              <Button 
                onClick={() => router.push('/')}
                variant="default"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

