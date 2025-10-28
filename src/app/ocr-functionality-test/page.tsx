"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, AlertCircle, Bot, FileText } from 'lucide-react';
import { clientOCR } from '@/services/client-ocr';
import { toast } from 'sonner';

export default function OCRFunctionalityTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [geminiResult, setGeminiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'ocr' | 'gemini' | 'complete'>('upload');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process OCR
    setIsProcessing(true);
    setError(null);
    setOcrResult(null);
    setGeminiResult(null);
    setStep('ocr');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        console.log('🔍 Starting OCR processing...');
        toast.info('Processing receipt with OCR...');
        
        // Step 1: OCR Processing
        const result = await clientOCR.extractTextFromImage(imageData);
        
        console.log('✅ OCR completed:', result);
        setOcrResult(result);
        setStep('gemini');
        toast.success('OCR completed! Processing with AI...');
        
        // Step 2: Gemini AI Processing
        if (result.text && result.text.trim().length > 5) {
          console.log('🤖 Sending to Gemini AI...');
          
          const response = await fetch('/api/gemini-ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'receipt-parsing',
              data: { receiptText: result.text }
            }),
          });

          const geminiResponse = await response.json();
          
          if (geminiResponse.success) {
            console.log('✅ Gemini AI completed:', geminiResponse.data);
            setGeminiResult(geminiResponse.data);
            setStep('complete');
            toast.success('Receipt processing complete!');
          } else {
            console.error('❌ Gemini AI failed:', geminiResponse.error);
            setError(`Gemini AI failed: ${geminiResponse.error}`);
            setStep('ocr');
          }
        } else {
          setError('OCR extracted insufficient text. Please try a clearer image.');
          setStep('upload');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'OCR processing failed');
      console.error('❌ OCR error:', err);
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTest = () => {
    setOcrResult(null);
    setGeminiResult(null);
    setError(null);
    setImagePreview(null);
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🧪 OCR Functionality Test</h1>
          <p className="text-xl text-gray-600">Complete end-to-end test of OCR + AI processing</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-blue-600' : step === 'ocr' || step === 'gemini' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : step === 'ocr' || step === 'gemini' || step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step === 'upload' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="font-medium">Upload</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step === 'ocr' ? 'text-blue-600' : step === 'gemini' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'ocr' ? 'bg-blue-600 text-white' : step === 'gemini' || step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step === 'ocr' ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 'gemini' || step === 'complete' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">OCR</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step === 'gemini' ? 'text-blue-600' : step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'gemini' ? 'bg-blue-600 text-white' : step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step === 'gemini' ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 'complete' ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-medium">AI</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                {step === 'complete' ? <CheckCircle className="w-5 h-5" /> : '4'}
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Receipt Image
              </CardTitle>
              <CardDescription>Upload a receipt or any image with text to test OCR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Select Image</Label>
                <Input 
                  type="file" 
                  id="image-upload" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </div>
              
              {imagePreview && (
                <div className="space-y-2">
                  <Label>Image Preview</Label>
                  <div className="border rounded-lg p-4">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded receipt" 
                      className="max-w-full h-auto max-h-64 mx-auto"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              <Button onClick={resetTest} variant="outline" className="w-full">
                Reset Test
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Processing Results
              </CardTitle>
              <CardDescription>OCR and AI processing results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OCR Results */}
              {ocrResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">OCR Results</span>
                    <Badge variant="secondary">{Math.round(ocrResult.confidence * 100)}% confidence</Badge>
                  </div>
                  <Textarea 
                    value={ocrResult.text} 
                    readOnly 
                    className="min-h-32 text-sm"
                    placeholder="Extracted text will appear here..."
                  />
                  <div className="text-xs text-gray-500">
                    Processing time: {ocrResult.processingTime}ms
                  </div>
                </div>
              )}

              {/* Gemini AI Results */}
              {geminiResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">AI Parsed Data</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    {geminiResult.merchant && (
                      <div><strong>Merchant:</strong> {geminiResult.merchant}</div>
                    )}
                    {geminiResult.amount && (
                      <div><strong>Amount:</strong> ${geminiResult.amount}</div>
                    )}
                    {geminiResult.date && (
                      <div><strong>Date:</strong> {new Date(geminiResult.date).toLocaleDateString()}</div>
                    )}
                    {geminiResult.total && (
                      <div><strong>Total:</strong> ${geminiResult.total}</div>
                    )}
                    {geminiResult.tax && (
                      <div><strong>Tax:</strong> ${geminiResult.tax}</div>
                    )}
                    {geminiResult.items && geminiResult.items.length > 0 && (
                      <div>
                        <strong>Items:</strong>
                        <ul className="ml-4 mt-1">
                          {geminiResult.items.map((item: any, index: number) => (
                            <li key={index} className="text-sm">• {item.name}: ${item.price}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!ocrResult && !geminiResult && !error && (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload an image to see OCR and AI processing results!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test OCR Functionality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📷</div>
                <h3 className="font-medium mb-1">1. Upload Image</h3>
                <p className="text-sm text-gray-600">Select a receipt or image with text</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-medium mb-1">2. OCR Processing</h3>
                <p className="text-sm text-gray-600">Tesseract.js extracts text from image</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-medium mb-1">3. AI Processing</h3>
                <p className="text-sm text-gray-600">Gemini AI parses structured data</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-medium mb-1">4. View Results</h3>
                <p className="text-sm text-gray-600">See extracted text and parsed data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
