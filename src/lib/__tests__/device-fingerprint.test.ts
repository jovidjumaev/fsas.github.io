import { 
  generateDeviceFingerprint, 
  hashDeviceFingerprint, 
  compareDeviceFingerprints,
  getCurrentLocation,
  isWithinGeofence,
  checkBrowserSupport,
  getBrowserInfo
} from '../device-fingerprint';

// Mock navigator properties
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  language: 'en-US',
  platform: 'MacIntel',
  cookieEnabled: true,
  doNotTrack: '1',
  hardwareConcurrency: 8,
  deviceMemory: 8,
  connection: {
    effectiveType: '4g'
  }
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

// Mock window.screen
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080
  },
  writable: true
});

// Mock Intl.DateTimeFormat
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: jest.fn().mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  },
  writable: true
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

describe('Device Fingerprinting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDeviceFingerprint', () => {
    it('should generate a complete device fingerprint', () => {
      const fingerprint = generateDeviceFingerprint();

      expect(fingerprint).toHaveProperty('userAgent');
      expect(fingerprint).toHaveProperty('screenResolution');
      expect(fingerprint).toHaveProperty('timezone');
      expect(fingerprint).toHaveProperty('language');
      expect(fingerprint).toHaveProperty('platform');
      expect(fingerprint).toHaveProperty('cookieEnabled');
      expect(fingerprint).toHaveProperty('doNotTrack');
      expect(fingerprint).toHaveProperty('hardwareConcurrency');
      expect(fingerprint).toHaveProperty('deviceMemory');
      expect(fingerprint).toHaveProperty('connectionType');

      expect(fingerprint.userAgent).toBe(mockNavigator.userAgent);
      expect(fingerprint.screenResolution).toBe('1920x1080');
      expect(fingerprint.timezone).toBe('America/New_York');
      expect(fingerprint.language).toBe('en-US');
      expect(fingerprint.platform).toBe('MacIntel');
      expect(fingerprint.cookieEnabled).toBe(true);
      expect(fingerprint.doNotTrack).toBe('1');
      expect(fingerprint.hardwareConcurrency).toBe(8);
      expect(fingerprint.deviceMemory).toBe(8);
      expect(fingerprint.connectionType).toBe('4g');
    });

    it('should handle missing optional properties', () => {
      const originalNavigator = global.navigator;
      const limitedNavigator = {
        ...mockNavigator,
        deviceMemory: undefined,
        connection: undefined
      };

      Object.defineProperty(global, 'navigator', {
        value: limitedNavigator,
        writable: true
      });

      const fingerprint = generateDeviceFingerprint();

      expect(fingerprint.deviceMemory).toBeUndefined();
      expect(fingerprint.connectionType).toBeUndefined();

      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true
      });
    });
  });

  describe('hashDeviceFingerprint', () => {
    it('should generate a consistent hash for the same fingerprint', () => {
      const fingerprint = generateDeviceFingerprint();
      const hash1 = hashDeviceFingerprint(fingerprint);
      const hash2 = hashDeviceFingerprint(fingerprint);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for different fingerprints', () => {
      const fingerprint1 = generateDeviceFingerprint();
      const fingerprint2 = {
        ...fingerprint1,
        userAgent: 'Different User Agent'
      };

      const hash1 = hashDeviceFingerprint(fingerprint1);
      const hash2 = hashDeviceFingerprint(fingerprint2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compareDeviceFingerprints', () => {
    it('should return 1.0 for identical fingerprints', () => {
      const fingerprint = generateDeviceFingerprint();
      const similarity = compareDeviceFingerprints(fingerprint, fingerprint);

      expect(similarity).toBe(1.0);
    });

    it('should return 0.0 for completely different fingerprints', () => {
      const fingerprint1 = generateDeviceFingerprint();
      const fingerprint2 = {
        userAgent: 'Different',
        screenResolution: 'Different',
        timezone: 'Different',
        language: 'Different',
        platform: 'Different',
        cookieEnabled: false,
        doNotTrack: 'Different',
        hardwareConcurrency: 0,
        deviceMemory: 0,
        connectionType: 'Different'
      };

      const similarity = compareDeviceFingerprints(fingerprint1, fingerprint2);
      expect(similarity).toBe(0.0);
    });

    it('should return a value between 0 and 1 for partially similar fingerprints', () => {
      const fingerprint1 = generateDeviceFingerprint();
      const fingerprint2 = {
        ...fingerprint1,
        userAgent: 'Different User Agent'
      };

      const similarity = compareDeviceFingerprints(fingerprint1, fingerprint2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('getCurrentLocation', () => {
    it('should resolve with location data when geolocation succeeds', async () => {
      const mockPosition = {
        coords: {
          latitude: 34.9224,
          longitude: -82.4365,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentLocation();

      expect(result).toEqual(mockPosition);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        })
      );
    });

    it('should reject when geolocation fails', async () => {
      const mockError = new Error('Geolocation error');
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation error');
    });

    it('should reject when geolocation is not supported', async () => {
      const originalGeolocation = global.navigator.geolocation;
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      await expect(getCurrentLocation()).rejects.toThrow('Geolocation is not supported by this browser');

      // Restore original geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true
      });
    });
  });

  describe('isWithinGeofence', () => {
    it('should return true when location is within geofence', () => {
      const result = isWithinGeofence(
        34.9224, -82.4365, // User location (Furman University)
        34.9224, -82.4365, // Center location
        100 // 100 meter radius
      );

      expect(result).toBe(true);
    });

    it('should return false when location is outside geofence', () => {
      const result = isWithinGeofence(
        35.0000, -82.0000, // User location (far away)
        34.9224, -82.4365, // Center location (Furman University)
        100 // 100 meter radius
      );

      expect(result).toBe(false);
    });

    it('should handle edge cases correctly', () => {
      // Test exact boundary
      const result = isWithinGeofence(
        34.9224, -82.4365, // Same location
        34.9224, -82.4365, // Center location
        0 // 0 meter radius
      );

      expect(result).toBe(true);
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return supported: true for modern browsers', () => {
      const result = checkBrowserSupport();

      expect(result.supported).toBe(true);
      expect(result.missingFeatures).toEqual([]);
    });

    it('should detect missing features', () => {
      const originalNavigator = global.navigator;
      const limitedNavigator = {
        ...mockNavigator,
        geolocation: undefined,
        mediaDevices: undefined
      };

      Object.defineProperty(global, 'navigator', {
        value: limitedNavigator,
        writable: true
      });

      const result = checkBrowserSupport();

      expect(result.supported).toBe(false);
      expect(result.missingFeatures).toContain('Geolocation');
      expect(result.missingFeatures).toContain('Camera access');

      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true
      });
    });
  });

  describe('getBrowserInfo', () => {
    it('should detect Chrome browser', () => {
      const originalUserAgent = global.navigator.userAgent;
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });

      const result = getBrowserInfo();

      expect(result.name).toBe('Chrome');
      expect(result.version).toBe('91');
      expect(result.os).toBe('macOS');
      expect(result.mobile).toBe(false);

      // Restore original user agent
      Object.defineProperty(global.navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      });
    });

    it('should detect mobile browsers', () => {
      const originalUserAgent = global.navigator.userAgent;
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        writable: true
      });

      const result = getBrowserInfo();

      expect(result.name).toBe('Safari');
      expect(result.mobile).toBe(true);
      expect(result.os).toBe('iOS');

      // Restore original user agent
      Object.defineProperty(global.navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true
      });
    });
  });
});
