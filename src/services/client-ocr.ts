import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

export class ClientSideOCRService {
  private static instance: ClientSideOCRService;
  private isInitialized = false;

  public static getInstance(): ClientSideOCRService {
    if (!ClientSideOCRService.instance) {
      ClientSideOCRService.instance = new ClientSideOCRService();
    }
    return ClientSideOCRService.instance;
  }

  /**
   * Extract text from an image using client-side OCR
   */
  public async extractTextFromImage(imageData: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting OCR processing...');
      
      // Convert base64 to image element
      const img = new Image();
      img.src = imageData;
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Use Tesseract.js to extract text
      const { data: { text, confidence } } = await Tesseract.recognize(
        img,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const processingTime = Date.now() - startTime;
      
      console.log('OCR completed:', { text: text.substring(0, 100) + '...', confidence, processingTime });
      
      return {
        text: text.trim(),
        confidence: confidence / 100, // Convert to 0-1 scale
        processingTime
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Check if OCR is available
   */
  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'Tesseract' in window;
  }
}

// Export singleton instance
export const clientOCR = ClientSideOCRService.getInstance();
