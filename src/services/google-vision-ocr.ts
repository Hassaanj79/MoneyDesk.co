import { ImageAnnotatorClient } from '@google-cloud/vision';
import { firebaseGemini } from './firebase-gemini';

export interface ReceiptData {
  merchant?: string;
  amount?: number;
  date?: Date;
  items?: Array<{
    name: string;
    price: number;
  }>;
  total?: number;
  tax?: number;
  rawText: string;
  confidence: number;
}

export interface OCRResult {
  success: boolean;
  data?: ReceiptData;
  error?: string;
}

class GoogleVisionOCRService {
  private client: ImageAnnotatorClient | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (this.isInitialized) return;

    try {
      // Check if Google Cloud credentials are available
      const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                           process.env.GOOGLE_CLOUD_PROJECT_ID ||
                           process.env.GOOGLE_VISION_API_KEY;

      if (!hasCredentials) {
        console.warn('Google Vision API credentials not found. OCR functionality will be disabled.');
        return;
      }

      // Initialize the Vision API client
      this.client = new ImageAnnotatorClient({
        // The client will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
        // or Application Default Credentials
      });

      this.isInitialized = true;
      console.log('Google Vision API client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Vision API client:', error);
      this.client = null;
    }
  }

  /**
   * Extract text from an image using Google Vision API
   */
  public async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    if (!this.client) {
      throw new Error('Google Vision API client not initialized');
    }

    try {
      const [result] = await this.client.textDetection({
        image: {
          content: imageBuffer,
        },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return '';
      }

      // Return the full text (first detection contains all text)
      return detections[0].description || '';
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Process a receipt image and extract structured data using both OCR and Gemini
   */
  public async processReceipt(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Google Vision API client not initialized. Please check your credentials.'
        };
      }

      // Extract text from the image using Google Vision API
      const rawText = await this.extractTextFromImage(imageBuffer);
      
      if (!rawText.trim()) {
        return {
          success: false,
          error: 'No text found in the image. Please ensure the receipt is clear and readable.'
        };
      }

      // Use Gemini for intelligent parsing if available
      let receiptData: ReceiptData;
      if (firebaseGemini.isAvailable()) {
        try {
          console.log('Using Gemini for intelligent receipt parsing...');
          const geminiData = await firebaseGemini.processReceiptWithGemini(rawText);
          
          // Convert Gemini data to our ReceiptData format
          receiptData = {
            merchant: geminiData.merchant,
            amount: geminiData.amount,
            date: geminiData.date ? new Date(geminiData.date) : undefined,
            items: geminiData.items,
            total: geminiData.total,
            tax: geminiData.tax,
            rawText: rawText,
            confidence: geminiData.confidence
          };
          
          console.log('Gemini parsing successful:', receiptData);
        } catch (geminiError) {
          console.warn('Gemini parsing failed, falling back to rule-based parsing:', geminiError);
          receiptData = this.parseReceiptText(rawText);
        }
      } else {
        console.log('Gemini not available, using rule-based parsing...');
        receiptData = this.parseReceiptText(rawText);
      }

      return {
        success: true,
        data: receiptData
      };
    } catch (error: any) {
      console.error('Error processing receipt:', error);
      return {
        success: false,
        error: error.message || 'Failed to process receipt'
      };
    }
  }

  /**
   * Parse receipt text to extract structured data
   */
  private parseReceiptText(text: string): ReceiptData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let merchant = '';
    let total = 0;
    let tax = 0;
    let date: Date | undefined;
    const items: Array<{ name: string; price: number }> = [];
    
    // Common patterns for receipt parsing
    const totalPatterns = [
      /total[:\s]*\$?(\d+\.?\d*)/i,
      /amount[:\s]*\$?(\d+\.?\d*)/i,
      /sum[:\s]*\$?(\d+\.?\d*)/i,
      /^.*\$(\d+\.?\d*)$/ // Last line with dollar amount
    ];

    const taxPatterns = [
      /tax[:\s]*\$?(\d+\.?\d*)/i,
      /vat[:\s]*\$?(\d+\.?\d*)/i,
      /gst[:\s]*\$?(\d+\.?\d*)/i
    ];

    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{2,4}/i
    ];

    // Extract merchant (usually first line or line with common merchant keywords)
    const merchantKeywords = ['store', 'shop', 'restaurant', 'cafe', 'market', 'mart', 'center', 'centre'];
    for (const line of lines.slice(0, 3)) { // Check first 3 lines
      if (merchantKeywords.some(keyword => line.toLowerCase().includes(keyword)) || 
          line.length > 5 && line.length < 50) {
        merchant = line;
        break;
      }
    }

    // Extract date
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            date = new Date(match[1]);
            if (!isNaN(date.getTime())) {
              break;
            }
          } catch (e) {
            // Invalid date, continue
          }
        }
      }
      if (date) break;
    }

    // Extract total amount
    for (const line of lines.reverse()) { // Check from bottom up
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          total = parseFloat(match[1]);
          if (total > 0) {
            break;
          }
        }
      }
      if (total > 0) break;
    }

    // Extract tax
    for (const line of lines) {
      for (const pattern of taxPatterns) {
        const match = line.match(pattern);
        if (match) {
          tax = parseFloat(match[1]);
          break;
        }
      }
      if (tax > 0) break;
    }

    // Extract items (lines with prices)
    const itemPattern = /^(.+?)\s+\$?(\d+\.?\d*)$/;
    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match && parseFloat(match[2]) > 0 && parseFloat(match[2]) < total) {
        items.push({
          name: match[1].trim(),
          price: parseFloat(match[2])
        });
      }
    }

    return {
      merchant: merchant || undefined,
      amount: total > 0 ? total : undefined,
      date: date,
      items: items.length > 0 ? items : undefined,
      total: total > 0 ? total : undefined,
      tax: tax > 0 ? tax : undefined,
      rawText: text,
      confidence: this.calculateConfidence(text, merchant, total, date)
    };
  }

  /**
   * Calculate confidence score based on extracted data quality
   */
  private calculateConfidence(text: string, merchant: string, total: number, date?: Date): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data quality
    if (merchant && merchant.length > 2) confidence += 0.2;
    if (total > 0) confidence += 0.2;
    if (date && !isNaN(date.getTime())) confidence += 0.1;
    if (text.length > 50) confidence += 0.1; // Longer text usually means better OCR

    return Math.min(confidence, 1.0);
  }

  /**
   * Check if the service is available
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export const googleVisionOCR = new GoogleVisionOCRService();
