"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { clientOCR } from '@/services/client-ocr';

export default function OCRTestPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        console.log('Starting OCR processing...');
        const result = await clientOCR.extractTextFromImage(imageData);
        
        setOcrResult(result);
        console.log('OCR completed:', result);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'OCR processing failed');
      console.error('OCR error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔍 OCR Test Page
          </h1>
          <p className="text-xl text-gray-600">
            Test the OCR functionality with your actual receipt images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Receipt Image
              </CardTitle>
              <CardDescription>
                Upload your Starbucks receipt or any receipt image to test OCR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Select Image</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <Label>Image Preview</Label>
                  <div className="border rounded-lg p-4 bg-white">
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className="max-w-full h-auto max-h-64 mx-auto"
                    />
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing OCR...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                OCR Results
              </CardTitle>
              <CardDescription>
                Extracted text from your receipt image
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ocrResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      Confidence: {Math.round(ocrResult.confidence * 100)}%
                    </Badge>
                    <Badge variant="outline">
                      Time: {ocrResult.processingTime}ms
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Extracted Text:</Label>
                    <Textarea
                      value={ocrResult.text}
                      readOnly
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Text Length:</strong> {ocrResult.text.length} characters</p>
                    <p><strong>Processing Time:</strong> {ocrResult.processingTime}ms</p>
                    <p><strong>Confidence:</strong> {Math.round(ocrResult.confidence * 100)}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No OCR results yet. Upload an image to see extracted text!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📷</div>
                <h3 className="font-medium mb-1">1. Upload Image</h3>
                <p className="text-sm text-gray-600">Select your Starbucks receipt image</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-medium mb-1">2. OCR Processing</h3>
                <p className="text-sm text-gray-600">Tesseract.js extracts text from image</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-medium mb-1">3. View Results</h3>
                <p className="text-sm text-gray-600">See the extracted text and confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
