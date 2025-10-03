/**
 * Password Security & Validation Utilities
 * Implements strong password requirements and security checks
 */

// Common passwords to blacklist (top 100 most common)
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
  'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1',
  'admin', 'administrator', 'root', 'toor', 'pass', 'test', 'guest',
  'changeme', 'Password1', 'Password123', '12341234', 'abcd1234',
  'qwerty123', 'letmein123', 'welcome123', 'admin123', 'test123',
  'furman', 'furman123', 'student', 'professor', 'university'
];

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  isValid: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
}

/**
 * Validates password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const feedback: string[] = [];
  let score = 0;

  // Check minimum length (12 characters)
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  } else {
    score += 20;
    if (password.length >= 16) {
      score += 10;
      feedback.push('Excellent length');
    } else if (password.length >= 14) {
      score += 5;
      feedback.push('Good length');
    }
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else {
    score += 15;
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    if (uppercaseCount >= 2) score += 5;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else {
    score += 15;
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount >= 2) score += 5;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else {
    score += 15;
    const numberCount = (password.match(/\d/g) || []).length;
    if (numberCount >= 2) score += 5;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  } else {
    score += 15;
    const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialCount >= 2) {
      score += 10;
      feedback.push('Multiple special characters');
    }
  }

  // Check for common passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
    errors.push('Password contains common words that are easy to guess');
    score = Math.max(0, score - 30);
  }

  // Check for sequential characters (123, abc, etc.)
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    feedback.push('Avoid sequential characters');
    score = Math.max(0, score - 10);
  }

  // Check for repeated characters (aaa, 111, etc.)
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
    score = Math.max(0, score - 10);
  }

  // Check for dictionary words (basic check)
  if (/^[a-zA-Z]+$/.test(password) && password.length < 15) {
    feedback.push('Mix letters with numbers and symbols');
    score = Math.max(0, score - 10);
  }

  // Bonus points for variety
  const charTypes = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ].filter(Boolean).length;

  if (charTypes === 4) {
    score += 10;
    feedback.push('Good character variety');
  }

  // Calculate strength level
  let level: PasswordStrength['level'];
  if (score < 30) {
    level = 'weak';
  } else if (score < 50) {
    level = 'fair';
  } else if (score < 70) {
    level = 'good';
  } else if (score < 85) {
    level = 'strong';
  } else {
    level = 'very-strong';
  }

  const strength: PasswordStrength = {
    score: Math.min(100, score),
    level,
    feedback,
    isValid: errors.length === 0 && score >= 50
  };

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Checks if password meets minimum security requirements
 */
export function meetsMinimumRequirements(password: string): boolean {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) &&
    !COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))
  );
}

/**
 * Generates a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash password for client-side comparison (NOT for storage)
 * Used to check if password has been used before without storing plaintext
 */
export async function hashPasswordForComparison(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get password requirements as readable list
 */
export function getPasswordRequirements(): string[] {
  return [
    'At least 12 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*...)',
    'No common or easily guessable passwords'
  ];
}

/**
 * Format password strength for display
 */
export function getStrengthColor(level: PasswordStrength['level']): string {
  switch (level) {
    case 'weak':
      return 'text-red-600';
    case 'fair':
      return 'text-orange-600';
    case 'good':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
    case 'very-strong':
      return 'text-emerald-600';
  }
}

export function getStrengthBgColor(level: PasswordStrength['level']): string {
  switch (level) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    case 'very-strong':
      return 'bg-emerald-500';
  }
}

