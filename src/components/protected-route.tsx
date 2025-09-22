"use client";

import React from 'react';
import { useModuleAccess } from '@/contexts/module-access-context';
import { AccessDenied } from '@/components/access-denied';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module: keyof import('@/types').ModuleAccess;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, module, fallback }: ProtectedRouteProps) {
  const { hasAccess, loading } = useModuleAccess();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess(module)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <AccessDenied 
        module={module} 
        requiredAccess={`access to the ${module} module`}
      />
    );
  }

  return <>{children}</>;
}

