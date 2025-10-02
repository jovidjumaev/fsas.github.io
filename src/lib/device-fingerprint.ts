import { DeviceFingerprint } from '@/types';

/**
 * Generate a device fingerprint for security purposes
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const nav = navigator;
  const screen = window.screen;
  
  return {
    userAgent: nav.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: nav.language,
    platform: nav.platform,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack || 'unspecified',
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: (nav as any).deviceMemory || undefined,
    connectionType: (nav as any).connection?.effectiveType || undefined
  };
}

/**
 * Create a hash from device fingerprint for storage
 */
export function hashDeviceFingerprint(fingerprint: DeviceFingerprint): string {
  const fingerprintString = JSON.stringify(fingerprint, Object.keys(fingerprint).sort());
  
  // Simple hash function (in production, use a proper crypto hash)
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Check if two device fingerprints are similar (for security)
 */
export function compareDeviceFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
  let matches = 0;
  let total = 0;
  
  const keys = Object.keys(fp1) as (keyof DeviceFingerprint)[];
  
  for (const key of keys) {
    if (fp1[key] !== undefined && fp2[key] !== undefined) {
      total++;
      if (fp1[key] === fp2[key]) {
        matches++;
      }
    }
  }
  
  return total > 0 ? matches / total : 0;
}

/**
 * Get client IP address (approximate)
 */
export async function getClientIP(): Promise<string> {
  try {
    // Try to get IP from a public service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    // Fallback to a random IP (for development)
    return '127.0.0.1';
  }
}

/**
 * Get geolocation with error handling
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Check if location is within geofence
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean {
  const R = 6371000; // Earth's radius in meters
  const dLat = (userLat - centerLat) * Math.PI / 180;
  const dLng = (userLng - centerLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(centerLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radiusMeters;
}

/**
 * Validate geolocation for classroom attendance
 */
export async function validateLocation(): Promise<{
  isValid: boolean;
  error?: string;
  location?: { latitude: number; longitude: number };
}> {
  try {
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;
    
    // Furman University coordinates (from env or default)
    const classroomLat = parseFloat(process.env.NEXT_PUBLIC_CLASSROOM_LAT || '34.9224');
    const classroomLng = parseFloat(process.env.NEXT_PUBLIC_CLASSROOM_LNG || '-82.4365');
    const radius = parseInt(process.env.NEXT_PUBLIC_GEOFENCE_RADIUS || '100');
    
    const isWithinRange = isWithinGeofence(
      latitude,
      longitude,
      classroomLat,
      classroomLng,
      radius
    );
    
    if (!isWithinRange) {
      return {
        isValid: false,
        error: 'You must be within the classroom to scan the QR code',
        location: { latitude, longitude }
      };
    }
    
    return {
      isValid: true,
      location: { latitude, longitude }
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Unable to verify location. Please enable location services.'
    };
  }
}

/**
 * Generate a unique session identifier for tracking
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if browser supports required features
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missingFeatures: string[];
} {
  const missingFeatures: string[] = [];
  
  if (!navigator.geolocation) {
    missingFeatures.push('Geolocation');
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    missingFeatures.push('Camera access');
  }
  
  if (!window.localStorage) {
    missingFeatures.push('Local Storage');
  }
  
  if (!window.fetch) {
    missingFeatures.push('Fetch API');
  }
  
  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}

/**
 * Get browser information for debugging
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  os: string;
  mobile: boolean;
} {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (ua.includes('Chrome')) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.includes('Edge')) {
    browserName = 'Edge';
    const match = ua.match(/Edge\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  // Detect mobile
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  return {
    name: browserName,
    version: browserVersion,
    os,
    mobile
  };
}
