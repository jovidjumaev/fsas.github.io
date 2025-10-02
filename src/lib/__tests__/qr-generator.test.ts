import { QRCodeGenerator, validateQRMiddleware } from '../qr-generator';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('mock-random-bytes')),
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hmac-digest'),
  }),
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}));

describe('QRCodeGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecureQR', () => {
    it('should generate a QR code with valid structure', async () => {
      const sessionId = 'test-session-123';
      const result = await QRCodeGenerator.generateSecureQR(sessionId);

      expect(result).toHaveProperty('qr_code');
      expect(result).toHaveProperty('expires_at');
      expect(result).toHaveProperty('session_id');
      expect(result.session_id).toBe(sessionId);
      expect(result.qr_code).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate different QR codes for different sessions', async () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      
      const result1 = await QRCodeGenerator.generateSecureQR(sessionId1);
      const result2 = await QRCodeGenerator.generateSecureQR(sessionId2);

      expect(result1.session_id).toBe(sessionId1);
      expect(result2.session_id).toBe(sessionId2);
      expect(result1.qr_code).not.toBe(result2.qr_code);
    });
  });

  describe('validateQR', () => {
    it('should validate a valid QR code', () => {
      const validQRData = {
        sessionId: 'test-session',
        timestamp: Date.now(),
        nonce: 'test-nonce',
        signature: 'mock-hmac-digest'
      };

      const result = QRCodeGenerator.validateQR(validQRData);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject expired QR codes', () => {
      const expiredQRData = {
        sessionId: 'test-session',
        timestamp: Date.now() - 60000, // 1 minute ago
        nonce: 'test-nonce',
        signature: 'mock-hmac-digest'
      };

      const result = QRCodeGenerator.validateQR(expiredQRData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('QR code has expired');
    });

    it('should reject QR codes with invalid signatures', () => {
      const invalidQRData = {
        sessionId: 'test-session',
        timestamp: Date.now(),
        nonce: 'test-nonce',
        signature: 'invalid-signature'
      };

      const result = QRCodeGenerator.validateQR(invalidQRData);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid QR code signature');
    });
  });

  describe('isQRExpiringSoon', () => {
    it('should return true for QR codes expiring within 5 seconds', () => {
      const qrData = {
        sessionId: 'test-session',
        timestamp: Date.now() - 25000, // 25 seconds ago
        nonce: 'test-nonce',
        signature: 'mock-hmac-digest'
      };

      const result = QRCodeGenerator.isQRExpiringSoon(qrData);
      expect(result).toBe(true);
    });

    it('should return false for QR codes with plenty of time left', () => {
      const qrData = {
        sessionId: 'test-session',
        timestamp: Date.now() - 10000, // 10 seconds ago
        nonce: 'test-nonce',
        signature: 'mock-hmac-digest'
      };

      const result = QRCodeGenerator.isQRExpiringSoon(qrData);
      expect(result).toBe(false);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return correct time remaining', () => {
      const qrData = {
        sessionId: 'test-session',
        timestamp: Date.now() - 10000, // 10 seconds ago
        nonce: 'test-nonce',
        signature: 'mock-hmac-digest'
      };

      const result = QRCodeGenerator.getTimeRemaining(qrData);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(20000); // Should be around 20 seconds
    });

    it('should return 0 for expired QR codes', () => {
      const qrData = {
        sessionId: 'test-session',
        timestamp: Date.now() - 60000, // 1 minute ago
        nonce: 'test-nonce',
        signature: 'mock-hmac-digest'
      };

      const result = QRCodeGenerator.getTimeRemaining(qrData);
      expect(result).toBe(0);
    });
  });
});

describe('validateQRMiddleware', () => {
  it('should validate properly formatted QR data', () => {
    const qrData = {
      sessionId: 'test-session',
      timestamp: Date.now(),
      nonce: 'test-nonce',
      signature: 'mock-hmac-digest'
    };

    const result = validateQRMiddleware(qrData);
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual(qrData);
  });

  it('should validate JSON string QR data', () => {
    const qrData = {
      sessionId: 'test-session',
      timestamp: Date.now(),
      nonce: 'test-nonce',
      signature: 'mock-hmac-digest'
    };

    const result = validateQRMiddleware(JSON.stringify(qrData));
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual(qrData);
  });

  it('should reject QR data with missing fields', () => {
    const invalidQRData = {
      sessionId: 'test-session',
      timestamp: Date.now(),
      // Missing nonce and signature
    };

    const result = validateQRMiddleware(invalidQRData);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Missing required QR code fields');
  });

  it('should reject invalid JSON', () => {
    const result = validateQRMiddleware('invalid-json');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid QR code format');
  });

  it('should reject expired QR codes', () => {
    const expiredQRData = {
      sessionId: 'test-session',
      timestamp: Date.now() - 60000, // 1 minute ago
      nonce: 'test-nonce',
      signature: 'mock-hmac-digest'
    };

    const result = validateQRMiddleware(expiredQRData);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('QR code has expired');
  });
});
