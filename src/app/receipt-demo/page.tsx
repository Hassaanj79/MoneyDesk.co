"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Receipt } from 'lucide-react';

export default function ReceiptAutoFillDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    date: new Date().toLocaleDateString()
  });
  const [lastProcessed, setLastProcessed] = useState<any>(null);

  const sampleReceipts = [
    {
      name: 'Starbucks Coffee',
      amount: 5.00,
      category: 'Food & Dining',
      receipt: 'STARBUCKS COFFEE\nGrande Latte $4.50\nTax $0.50\nTotal $5.00'
    },
    {
      name: 'Amazon.com',
      amount: 31.98,
      category: 'Shopping',
      receipt: 'AMAZON.COM\nWireless Mouse $25.99\nShipping $5.99\nTotal $31.98'
    },
    {
      name: 'Netflix',
      amount: 15.99,
      category: 'Subscriptions',
      receipt: 'NETFLIX\nMonthly Subscription $15.99\nTotal $15.99'
    },
    {
      name: 'McDonald\'s',
      amount: 9.89,
      category: 'Food & Dining',
      receipt: 'MCDONALD\'S\nBig Mac Meal $8.99\nTax $0.90\nTotal $9.89'
    }
  ];

  const categories = ['Food & Dining', 'Shopping', 'Subscriptions', 'Entertainment', 'Transportation', 'Utilities'];

  const processReceipt = async (receipt: any) => {
    setIsProcessing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Auto-fill the form with AI-extracted data
    setFormData({
      name: receipt.name,
      amount: receipt.amount.toString(),
      category: receipt.category,
      date: new Date().toLocaleDateString()
    });
    
    setLastProcessed(receipt);
    setIsProcessing(false);
  };

  const clearForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      date: new Date().toLocaleDateString()
    });
    setLastProcessed(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧾 Receipt Auto-Fill Demo
          </h1>
          <p className="text-xl text-gray-600">
            See how AI automatically fills transaction details from receipt images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Receipt Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sample Receipts
              </CardTitle>
              <CardDescription>
                Click on a receipt to see AI auto-fill the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleReceipts.map((receipt, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{receipt.name}</h3>
                    <Badge variant="secondary">${receipt.amount}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-mono whitespace-pre-line">
                    {receipt.receipt}
                  </p>
                  <Button 
                    onClick={() => processReceipt(receipt)}
                    disabled={isProcessing}
                    size="sm"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Process with AI'
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Transaction Form
              </CardTitle>
              <CardDescription>
                Form fields auto-filled by AI from receipt processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Merchant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Auto-filled by AI"
                  className={formData.name ? 'bg-green-50 border-green-200' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Auto-filled by AI"
                  className={formData.amount ? 'bg-green-50 border-green-200' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={formData.category ? 'bg-green-50 border-green-200' : ''}>
                    <SelectValue placeholder="AI suggested category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="Auto-filled by AI"
                  className={formData.date ? 'bg-green-50 border-green-200' : ''}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={clearForm} variant="outline" className="flex-1">
                  Clear Form
                </Button>
                <Button className="flex-1" disabled={!formData.name || !formData.amount}>
                  Add Transaction
                </Button>
              </div>

              {lastProcessed && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Last Processed:</h4>
                  <div className="text-sm text-blue-800">
                    <p><strong>Merchant:</strong> {lastProcessed.name}</p>
                    <p><strong>Amount:</strong> ${lastProcessed.amount}</p>
                    <p><strong>Category:</strong> {lastProcessed.category}</p>
                    <p><strong>Confidence:</strong> 95%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📷</div>
                <h3 className="font-medium mb-1">1. Capture Image</h3>
                <p className="text-sm text-gray-600">Take photo or upload receipt image</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-medium mb-1">2. AI Processing</h3>
                <p className="text-sm text-gray-600">Gemini AI extracts text and data</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🏷️</div>
                <h3 className="font-medium mb-1">3. Smart Categorization</h3>
                <p className="text-sm text-gray-600">AI suggests appropriate category</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-medium mb-1">4. Auto-Fill Form</h3>
                <p className="text-sm text-gray-600">All fields populated automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
