"use client";

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function AIPrivacyToggle() {
  const { user } = useAuth();
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user's AI preference from localStorage or user settings
    const savedPreference = localStorage.getItem(`ai-enabled-${user?.uid}`);
    setAiEnabled(savedPreference === 'true');
    setLoading(false);
  }, [user?.uid]);

  const handleToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    localStorage.setItem(`ai-enabled-${user?.uid}`, enabled.toString());
    
    // You could also save this to a user settings API endpoint
    // saveUserPreference('ai_enabled', enabled);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading AI settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4" />
          AI Financial Assistant
        </CardTitle>
        <CardDescription className="text-sm">
          Enable AI-powered financial insights and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {aiEnabled ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <Label htmlFor="ai-toggle" className="text-sm font-medium">
              Use AI Summaries
            </Label>
          </div>
          <Switch
            id="ai-toggle"
            checked={aiEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
        
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Privacy & Security</p>
            <p>
              AI analysis only uses aggregated financial data (amounts, categories, dates). 
              No personal details or transaction descriptions are shared. 
              You can disable this feature at any time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
