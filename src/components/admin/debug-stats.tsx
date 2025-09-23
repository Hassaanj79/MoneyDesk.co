"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminStats, getAllUsers } from '@/services/admin';

export function DebugStats() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      console.log('=== DEBUG: Fetching admin stats ===');
      const stats = await getAdminStats();
      console.log('Stats result:', stats);
      
      console.log('=== DEBUG: Fetching all users ===');
      const users = await getAllUsers();
      console.log('Users result:', users);
      
      setDebugInfo({
        stats,
        users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Debug fetch error:', error);
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
        <CardDescription>
          Debug admin data fetching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchDebugInfo} disabled={loading}>
          {loading ? 'Fetching...' : 'Refresh Debug Info'}
        </Button>
        
        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Stats:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo.stats, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium">Users ({debugInfo.users?.length || 0}):</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo.users, null, 2)}
              </pre>
            </div>
            
            {debugInfo.error && (
              <div>
                <h4 className="font-medium text-red-600">Error:</h4>
                <pre className="text-xs bg-red-100 p-2 rounded overflow-auto">
                  {debugInfo.error}
                </pre>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Last updated: {debugInfo.timestamp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
