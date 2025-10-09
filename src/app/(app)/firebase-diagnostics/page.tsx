"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, CheckCircle, XCircle, AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getFirebaseDiagnostics, 
  getFirebaseSetupRecommendations 
} from '@/services/firebase-diagnostics';

export default function FirebaseDiagnosticsPage() {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const results = await getFirebaseDiagnostics();
      setDiagnostics(results);
      
      const recs = getFirebaseSetupRecommendations(results);
      setRecommendations(recs);
      
      toast.success('Firebase diagnostics completed');
    } catch (error: any) {
      toast.error(`Diagnostics failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/settings?tab=security')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Security Settings
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Firebase Diagnostics</h1>
                <p className="text-gray-600">Diagnose Firebase configuration issues</p>
              </div>
            </div>
          </div>

          {/* Diagnostics Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Firebase Configuration Diagnostics</CardTitle>
              <CardDescription>
                Run diagnostics to identify Firebase configuration issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runDiagnostics} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Diagnostics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Diagnostics Results */}
          {diagnostics && (
            <div className="space-y-6">
              {/* Configuration Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.config.isAvailable ? 'success' : 'error')}
                    Firebase Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Status:</strong> {diagnostics.config.isAvailable ? 'Available' : 'Not Available'}
                    </div>
                    <div>
                      <strong>Has Config:</strong> {diagnostics.config.hasConfig ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Project ID:</strong> {diagnostics.config.projectId || 'Not set'}
                    </div>
                    <div>
                      <strong>API Key:</strong> {diagnostics.config.apiKey || 'Not set'}
                    </div>
                    <div>
                      <strong>Auth Domain:</strong> {diagnostics.config.authDomain || 'Not set'}
                    </div>
                    <div>
                      <strong>Storage Bucket:</strong> {diagnostics.config.storageBucket || 'Not set'}
                    </div>
                  </div>

                  {diagnostics.config.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Configuration Errors:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {diagnostics.config.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {diagnostics.config.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Configuration Warnings:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {diagnostics.config.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Auth Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.auth.status)}
                    Firebase Authentication
                    {getStatusBadge(diagnostics.auth.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{diagnostics.auth.message}</p>
                  
                  {diagnostics.auth.details && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {Object.entries(diagnostics.auth.details).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}

                  {diagnostics.auth.recommendations && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendations:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {diagnostics.auth.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Phone Auth Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.phoneAuth.status)}
                    Firebase Phone Authentication
                    {getStatusBadge(diagnostics.phoneAuth.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{diagnostics.phoneAuth.message}</p>
                  
                  {diagnostics.phoneAuth.recommendations && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Phone Auth Setup:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {diagnostics.phoneAuth.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Setup Recommendations */}
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Setup Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-sm text-gray-600 mt-1">•</span>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Environment Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Environment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span className="font-mono text-sm">{diagnostics.timestamp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environment:</span>
                      <span>{diagnostics.environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Agent:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs max-w-md truncate">
                          {diagnostics.userAgent}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(diagnostics.userAgent)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
