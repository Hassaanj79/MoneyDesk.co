import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, Target, TrendingUp } from 'lucide-react';

interface CleanAccountWelcomeProps {
  onComplete: () => void;
}

export function CleanAccountWelcome({ onComplete }: CleanAccountWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to MoneyDesk! 🎉
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
            Your account is ready with a clean, fresh start. No dummy data, no clutter - just you and your financial journey.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ✨ What makes your account special:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Clean slate:</strong> No dummy transactions or phantom data</li>
              <li>• <strong>Privacy first:</strong> Your data stays yours, no pre-populated content</li>
              <li>• <strong>Custom setup:</strong> Create your own categories and accounts</li>
              <li>• <strong>Fresh start:</strong> Build your financial tracking from scratch</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">1. Create Account</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add your first bank account or wallet</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">2. Set Categories</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Create custom income and expense categories</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">3. Start Tracking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add your first transaction and begin!</p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={onComplete}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Let's Get Started! 🚀
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
