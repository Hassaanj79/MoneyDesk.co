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

  constructor() {
    this.initializeOCR();
  }

  private async initializeOCR() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    try {
      // Pre-load Tesseract.js worker for better performance
      await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core') {
            console.log('Loading Tesseract core...');
          }
        }
      });
      this.isInitialized = true;
      console.log('Tesseract.js OCR initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Tesseract.js:', error);
    }
  }

  /**
   * Extract text from an image using client-side OCR
   */
  public async extractTextFromImage(imageData: string): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting OCR processing...');
      
      // Check if OCR is available
      if (!this.isAvailable()) {
        throw new Error('OCR is not available in this environment');
      }
      
      // Validate image data
      if (!imageData || !imageData.startsWith('data:image/')) {
        throw new Error('Invalid image data format');
      }
      
      // Convert base64 to image element
      const img = new Image();
      img.src = imageData;
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      // Use Tesseract.js to extract text with optimized settings for receipts
      const { data: { text, confidence } } = await Tesseract.recognize(
        img,
        'eng',
        {
          // PSM 6: Uniform block of text (best for receipts)
          tessedit_pageseg_mode: '6',
          // PSM 11: Sparse text (try different orientations)
          tessedit_ocr_engine_mode: '2', // Neural nets LSTM engine
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
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if OCR is available
   */
  public isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof Tesseract !== 'undefined';
  }
}

// Export singleton instance
export const clientOCR = ClientSideOCRService.getInstance();
