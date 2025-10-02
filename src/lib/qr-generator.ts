import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { QRCodeData, QRCodeResponse } from '@/types';

export class QRCodeGenerator {
  private static readonly QR_SECRET = process.env.QR_SECRET || 'default-secret-key';
  private static readonly QR_EXPIRY_SECONDS = 30;

  /**
   * Generate a secure QR code for a class session
   */
  static async generateSecureQR(sessionId: string): Promise<QRCodeResponse> {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const qrCodeSecret = crypto.randomBytes(32).toString('hex');
    
    // Create the data to be signed
    const data = `${sessionId}-${timestamp}-${nonce}-${qrCodeSecret}`;
    
    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', this.QR_SECRET)
      .update(data)
      .digest('hex');

    const qrData: QRCodeData = {
      sessionId,
      timestamp,
      nonce,
      signature
    };

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    const expiresAt = new Date(timestamp + (this.QR_EXPIRY_SECONDS * 1000));

    return {
      qr_code: qrCodeImage,
      expires_at: expiresAt.toISOString(),
      session_id: sessionId
    };
  }

  /**
   * Validate a scanned QR code
   */
  static validateQR(qrData: QRCodeData): { isValid: boolean; error?: string } {
    try {
      // Check if QR code is expired
      const now = Date.now();
      const qrAge = now - qrData.timestamp;
      const maxAge = this.QR_EXPIRY_SECONDS * 1000;

      if (qrAge > maxAge) {
        return { isValid: false, error: 'QR code has expired' };
      }

      // Recreate the data string
      const data = `${qrData.sessionId}-${qrData.timestamp}-${qrData.nonce}`;
      
      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.QR_SECRET)
        .update(data)
        .digest('hex');

      // Compare signatures
      if (expectedSignature !== qrData.signature) {
        return { isValid: false, error: 'Invalid QR code signature' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid QR code format' };
    }
  }

  /**
   * Generate a new QR code for an existing session
   */
  static async refreshQR(sessionId: string): Promise<QRCodeResponse> {
    return this.generateSecureQR(sessionId);
  }

  /**
   * Check if QR code is about to expire (within 5 seconds)
   */
  static isQRExpiringSoon(qrData: QRCodeData): boolean {
    const now = Date.now();
    const qrAge = now - qrData.timestamp;
    const timeUntilExpiry = (this.QR_EXPIRY_SECONDS * 1000) - qrAge;
    
    return timeUntilExpiry <= 5000; // 5 seconds
  }

  /**
   * Get time remaining until QR code expires
   */
  static getTimeRemaining(qrData: QRCodeData): number {
    const now = Date.now();
    const qrAge = now - qrData.timestamp;
    const timeRemaining = (this.QR_EXPIRY_SECONDS * 1000) - qrAge;
    
    return Math.max(0, timeRemaining);
  }

  /**
   * Generate a simple QR code for testing (less secure)
   */
  static async generateSimpleQR(sessionId: string): Promise<string> {
    const qrData = {
      sessionId,
      timestamp: Date.now(),
      type: 'simple'
    };

    return await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'L',
      width: 256
    });
  }
}

/**
 * QR Code validation middleware
 */
export function validateQRMiddleware(qrData: any): { isValid: boolean; error?: string; data?: QRCodeData } {
  try {
    // Parse QR data
    const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    
    // Validate required fields
    if (!parsed.sessionId || !parsed.timestamp || !parsed.nonce || !parsed.signature) {
      return { isValid: false, error: 'Missing required QR code fields' };
    }

    // Validate QR code
    const validation = QRCodeGenerator.validateQR(parsed);
    
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }

    return { isValid: true, data: parsed };
  } catch (error) {
    return { isValid: false, error: 'Invalid QR code format' };
  }
}

/**
 * Generate QR code with custom options
 */
export async function generateCustomQR(
  data: any,
  options: {
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  } = {}
): Promise<string> {
  const defaultOptions = {
    errorCorrectionLevel: 'M' as const,
    type: 'image/png' as const,
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return QRCode.toDataURL(JSON.stringify(data), mergedOptions);
}
