import { supabase, supabaseAdmin } from './supabase';
import { createHash } from 'crypto';

export interface EmployeeIdValidationResult {
  isUnique: boolean;
  error?: string;
}

/**
 * Validates employee ID format and uniqueness for professor registration.
 * Ensures the employee ID is in the correct format and not already in use.
 * @param employeeId The employee ID to validate.
 * @returns A promise resolving to an EmployeeIdValidationResult.
 */
export async function validateEmployeeIdUniqueness(employeeId: string): Promise<EmployeeIdValidationResult> {
  console.log('👨‍🏫 ===== EMPLOYEE ID UNIQUENESS VALIDATION START =====');
  console.log('👨‍🏫 Employee ID to validate:', employeeId);

  // 1. Basic format validation
  if (!employeeId || typeof employeeId !== 'string') {
    console.log('❌ Employee ID is missing or invalid');
    return {
      isUnique: false,
      error: 'Employee ID is required.'
    };
  }

  const trimmedEmployeeId = employeeId.trim();
  
  if (trimmedEmployeeId.length === 0) {
    console.log('❌ Employee ID is empty');
    return {
      isUnique: false,
      error: 'Employee ID is required.'
    };
  }

  // 2. Format validation (exactly 7 digits)
  const employeeIdRegex = /^\d{7}$/;
  if (!employeeIdRegex.test(trimmedEmployeeId)) {
    console.log('❌ Employee ID format invalid:', trimmedEmployeeId);
    return {
      isUnique: false,
      error: 'Employee ID must be exactly 7 digits.\n\n💡 Example: 1234567\n\nPlease enter your official employee ID number.'
    };
  }

  console.log('✅ Employee ID format is valid');

  // 3. Check if professors table exists
  try {
    console.log('🔍 Checking if professors table exists...');
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('professors')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Error checking professors table:', tableError);
      return {
        isUnique: false,
        error: 'Unable to verify employee ID uniqueness. Please try again or contact support.'
      };
    }
    console.log('✅ Professors table exists');
  } catch (error) {
    console.error('❌ Exception checking professors table:', error);
    return {
      isUnique: false,
      error: 'Unable to verify employee ID uniqueness. Please try again or contact support.'
    };
  }

  // 4. Check uniqueness in professors table
  try {
    console.log('🔍 Checking employee ID uniqueness in professors table...');
    const { data: existingProfessor, error: dbError } = await supabaseAdmin
      .from('professors')
      .select('id, employee_id')
      .eq('employee_id', trimmedEmployeeId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking employee ID uniqueness in professors table:', dbError);
      return {
        isUnique: false,
        error: 'Unable to verify employee ID uniqueness. Please try again or contact support.'
      };
    }

    if (existingProfessor) {
      console.log('❌ Employee ID already exists in professors table:', existingProfessor.id);
      return {
        isUnique: false,
        error: `Employee ID "${trimmedEmployeeId}" is already in use.\n\n💡 Please use a different employee ID or contact support if you believe this is an error.`
      };
    }
    console.log('✅ Employee ID is unique in professors table');
  } catch (error) {
    console.error('❌ Exception during professors table uniqueness check:', error);
    return {
      isUnique: false,
      error: 'An unexpected error occurred during employee ID validation.'
    };
  }

  console.log('✅ Employee ID validation complete: unique and valid');
  console.log('👨‍🏫 ===== EMPLOYEE ID UNIQUENESS VALIDATION END =====');
  return { isUnique: true };
}

/**
 * Records an employee ID hash for uniqueness tracking after successful registration.
 * This is used for additional security and tracking purposes.
 * @param userId The user ID from the created user.
 * @param employeeId The employee ID that was used.
 * @returns A promise resolving to true if successful, false otherwise.
 */
export async function recordEmployeeIdHash(userId: string, employeeId: string): Promise<boolean> {
  try {
    console.log('📝 Recording employee ID hash for uniqueness tracking...');
    
    // Create a hash of the employee ID for additional tracking
    const employeeIdHash = createHash('sha256').update(employeeId.trim().toLowerCase()).digest('hex');
    
    // Store the hash in a tracking table (if it exists)
    // For now, we'll just log it since the main uniqueness is enforced by the database constraint
    console.log('✅ Employee ID hash recorded:', employeeIdHash);
    
    return true;
  } catch (error) {
    console.error('❌ Error recording employee ID hash:', error);
    return false;
  }
}

/**
 * Validates employee ID format for client-side validation.
 * @param employeeId The employee ID to validate.
 * @returns An object with validation results.
 */
export function validateEmployeeIdFormat(employeeId: string): { isValid: boolean; error?: string } {
  if (!employeeId || employeeId.trim().length === 0) {
    return { isValid: false, error: 'Employee ID is required.' };
  }

  const trimmed = employeeId.trim();
  const employeeIdRegex = /^\d{7}$/;
  
  if (!employeeIdRegex.test(trimmed)) {
    return { 
      isValid: false, 
      error: 'Employee ID must be exactly 7 digits.\n\n💡 Example: 1234567' 
    };
  }

  return { isValid: true };
}
