/**
 * Comprehensive Error Handling for Authentication and Database Operations
 * Provides user-friendly error messages and detailed logging
 */

export interface DetailedError {
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  suggestion?: string;
}

/**
 * Parse and enhance Supabase/PostgreSQL errors
 */
export function parseSupabaseError(error: any, context: string): DetailedError {
  console.error(`❌ Error in ${context}:`, error);

  // Extract error information
  const code = error?.code || error?.error_code || '';
  const message = error?.message || 'Unknown error occurred';
  const details = error?.details || error?.hint || '';

  // Database-specific error codes
  switch (code) {
    case '23505': // Unique violation
      return {
        message,
        userMessage: 'This information is already in use. Please use different details or contact support if you believe this is an error.',
        code,
        details,
        suggestion: 'Try using a different email address or student/employee ID.'
      };

    case '23503': // Foreign key violation
      return {
        message,
        userMessage: 'Database relationship error. This usually means required data is missing.',
        code,
        details,
        suggestion: 'Please try signing out and back in. If the problem persists, contact support.'
      };

    case '42P01': // Undefined table
      return {
        message,
        userMessage: 'Database is not properly configured. Please contact support.',
        code,
        details,
        suggestion: 'The system administrator needs to run the database setup script.'
      };

    case '42501': // Insufficient privilege
      return {
        message,
        userMessage: 'Permission denied. Your account may not be properly configured.',
        code,
        details,
        suggestion: 'Please contact support to verify your account permissions.'
      };

    case 'PGRST116': // No rows returned
      return {
        message,
        userMessage: 'No data found. The record you\'re looking for doesn\'t exist.',
        code,
        details,
        suggestion: 'Please verify the information and try again.'
      };

    case '23502': // Not null violation
      return {
        message,
        userMessage: 'Required information is missing. Please fill in all required fields.',
        code,
        details,
        suggestion: 'Make sure all required fields (marked with *) are filled in.'
      };

    default:
      break;
  }

  // Check for specific error messages
  if (message.includes('Invalid API key')) {
    return {
      message,
      userMessage: 'System configuration error. Please contact support.',
      code: 'INVALID_API_KEY',
      details,
      suggestion: 'The system administrator needs to update API keys in the configuration.'
    };
  }

  if (message.includes('already registered') || message.includes('already exists')) {
    return {
      message,
      userMessage: 'This email address is already registered. Please sign in instead or use a different email.',
      code: 'DUPLICATE_EMAIL',
      details,
      suggestion: 'Try signing in with your existing account or use the "Forgot Password" link.'
    };
  }

  if (message.includes('Email not confirmed')) {
    return {
      message,
      userMessage: 'Please check your email and click the confirmation link before signing in.',
      code: 'EMAIL_NOT_CONFIRMED',
      details,
      suggestion: 'Check your spam folder if you don\'t see the confirmation email.'
    };
  }

  if (message.includes('Invalid login credentials')) {
    return {
      message,
      userMessage: 'Invalid email or password. Please check your credentials and try again.',
      code: 'INVALID_CREDENTIALS',
      details,
      suggestion: 'Make sure your email and password are correct, or use "Forgot Password" to reset.'
    };
  }

  if (message.includes('Too many requests')) {
    return {
      message,
      userMessage: 'Too many attempts. Please wait a moment and try again.',
      code: 'RATE_LIMITED',
      details,
      suggestion: 'Wait 1-2 minutes before trying again.'
    };
  }

  if (message.includes('Network')) {
    return {
      message,
      userMessage: 'Network connection error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      details,
      suggestion: 'Make sure you\'re connected to the internet and try again.'
    };
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      message,
      userMessage: 'Request timed out. Please try again.',
      code: 'TIMEOUT',
      details,
      suggestion: 'The server is taking too long to respond. Please try again in a moment.'
    };
  }

  // Default error
  return {
    message,
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    code: code || 'UNKNOWN',
    details,
    suggestion: 'If this keeps happening, please contact support with the error details.'
  };
}

/**
 * Enhanced error logging for debugging
 */
export function logDetailedError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
) {
  console.group(`❌ Error in ${context}`);
  console.error('Error:', error);
  console.error('Message:', error?.message);
  console.error('Code:', error?.code || error?.error_code);
  console.error('Details:', error?.details || error?.hint);
  console.error('Status:', error?.status || error?.statusCode);
  
  if (additionalInfo) {
    console.error('Additional Info:', additionalInfo);
  }
  
  if (error?.stack) {
    console.error('Stack:', error.stack);
  }
  
  console.groupEnd();
}

/**
 * Test database connectivity and permissions
 */
export async function testDatabaseConnection(supabase: any): Promise<DetailedError | null> {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can query the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection test failed:', error);
      return parseSupabaseError(error, 'Database Connection Test');
    }
    
    console.log('✅ Database connection test passed');
    return null;
  } catch (error) {
    console.error('❌ Unexpected error during database test:', error);
    return {
      message: 'Database connection test failed',
      userMessage: 'Cannot connect to the database. Please try again later.',
      code: 'CONNECTION_FAILED',
      suggestion: 'Check your internet connection or contact support if the problem persists.'
    };
  }
}

/**
 * Format error message for display to user
 */
export function formatErrorForUser(error: DetailedError): string {
  let message = error.userMessage;
  
  if (error.suggestion) {
    message += `\n\n💡 Suggestion: ${error.suggestion}`;
  }
  
  return message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'CONNECTION_FAILED',
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '57P03', // cannot_connect_now
  ];
  
  const code = error?.code || error?.error_code || '';
  return retryableCodes.includes(code) || error?.message?.includes('timeout');
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}...`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts && isRetryableError(error)) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Validate required fields are present
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[]; message?: string } {
  const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
      message: `Please fill in the following required fields: ${missingFields.join(', ')}`
    };
  }
  
  return { valid: true, missingFields: [] };
}

/**
 * Create user-friendly error message with troubleshooting steps
 */
export function createTroubleshootingMessage(errorContext: string, error: DetailedError): string {
  const troubleshooting = `
❌ ${error.userMessage}

📋 Error Details:
   Context: ${errorContext}
   Code: ${error.code || 'N/A'}

💡 What to try:
   ${error.suggestion || 'Please try again or contact support'}

🆘 Still having issues?
   Please contact support with the following information:
   - What you were trying to do: ${errorContext}
   - Error code: ${error.code}
   - Time: ${new Date().toISOString()}
  `.trim();
  
  return troubleshooting;
}

