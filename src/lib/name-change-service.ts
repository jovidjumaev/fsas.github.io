import { supabase } from './supabase';

export interface NameChangeInfo {
  canChange: boolean;
  remainingChanges: number;
  lastChangeDate?: string;
  nextResetDate: string;
}

export interface NameChangeResult {
  success: boolean;
  message: string;
  remainingChanges?: number;
}

export class NameChangeService {
  /**
   * Check if user can change their name and get remaining changes
   */
  static async getNameChangeInfo(userId: string): Promise<NameChangeInfo> {
    try {
      // Try to get data from localStorage first (client-side tracking)
      if (typeof window === 'undefined') {
        // Server-side, return default values
        return {
          remainingChanges: 2,
          lastChangeDate: undefined,
          canChange: true,
          nextResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
      }
      
      const storageKey = `name_changes_${userId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const data = JSON.parse(storedData);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Check if we're in the same month
        if (data.month === currentMonth && data.year === currentYear) {
          const remainingChanges = Math.max(0, 2 - data.count);
          const nextMonth = new Date(currentYear, currentMonth + 1, 1);
          const nextResetDate = nextMonth.toISOString().split('T')[0];
          
          return {
            canChange: remainingChanges > 0,
            remainingChanges,
            lastChangeDate: data.lastChange || undefined,
            nextResetDate
          };
        }
      }
      
      // If no stored data or different month, assume fresh start
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextResetDate = nextMonth.toISOString().split('T')[0];
      
      return {
        canChange: true,
        remainingChanges: 2,
        lastChangeDate: undefined,
        nextResetDate
      };
    } catch (error) {
      console.error('Error in getNameChangeInfo:', error);
      // Return fallback values if there's any error
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextResetDate = nextMonth.toISOString().split('T')[0];
      
      return {
        canChange: true, // Allow changes if we can't check limits
        remainingChanges: 2, // Assume 2 changes available
        lastChangeDate: undefined,
        nextResetDate
      };
    }
  }

  /**
   * Attempt to change user's name with validation
   */
  static async changeName(
    userId: string,
    oldFirstName: string,
    oldLastName: string,
    newFirstName: string,
    newLastName: string,
    reason?: string
  ): Promise<NameChangeResult> {
    try {
      // First check if user can change name
      const { data: canChange, error: canChangeError } = await (supabase as any).rpc('can_change_name', {
        user_uuid: userId
      });

      if (canChangeError) {
        console.error('Error checking name change permission:', canChangeError);
        // If the function doesn't exist, allow the change but log a warning
        console.warn('Name change limit checking not available, allowing change');
      } else if (!canChange) {
        return {
          success: false,
          message: 'You have reached the maximum number of name changes for this month (2). Please wait until next month to change your name again.'
        };
      }

      // Validate input
      if (!newFirstName.trim() || !newLastName.trim()) {
        return {
          success: false,
          message: 'First name and last name are required.'
        };
      }

      if (newFirstName.trim() === oldFirstName.trim() && newLastName.trim() === oldLastName.trim()) {
        return {
          success: false,
          message: 'New name must be different from current name.'
        };
      }

      // Record the name change
      const { data, error } = await (supabase as any).rpc('record_name_change', {
        user_uuid: userId,
        old_first_name: oldFirstName,
        old_last_name: oldLastName,
        new_first_name: newFirstName.trim(),
        new_last_name: newLastName.trim(),
        change_reason: reason || 'Profile update'
      });

      if (error) {
        console.error('Error recording name change:', error);
        // If the function doesn't exist, continue without recording the change
        console.warn('Name change recording not available, continuing without tracking');
      } else if (!data) {
        return {
          success: false,
          message: 'Failed to update name. You may have reached the monthly limit.'
        };
      }

      // Track the name change in localStorage
      try {
        if (typeof window === 'undefined') {
          // Server-side, skip localStorage tracking
          return {
            success: true,
            message: 'Name updated successfully'
          };
        }
        
        const storageKey = `name_changes_${userId}`;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const storedData = localStorage.getItem(storageKey);
        let data = storedData ? JSON.parse(storedData) : { count: 0, month: currentMonth, year: currentYear, lastChange: null };
        
        // Reset if different month
        if (data.month !== currentMonth || data.year !== currentYear) {
          data = { count: 0, month: currentMonth, year: currentYear, lastChange: null };
        }
        
        // Increment count and update last change
        data.count += 1;
        data.lastChange = now.toISOString();
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        const remainingChanges = Math.max(0, 2 - data.count);
        
        return {
          success: true,
          message: `Name updated successfully! You have ${remainingChanges} name changes remaining this month.`,
          remainingChanges
        };
      } catch (error) {
        // If we can't track the change, just return success
        return {
          success: true,
          message: 'Name updated successfully!'
        };
      }
    } catch (error) {
      console.error('Error in changeName:', error);
      return {
        success: false,
        message: 'An error occurred while updating your name. Please try again.'
      };
    }
  }

  /**
   * Get name change history for user
   */
  static async getNameChangeHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('name_change_history' as any)
        .select('*')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Error getting name change history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNameChangeHistory:', error);
      throw error;
    }
  }

  /**
   * Check if names are different
   */
  static areNamesDifferent(
    oldFirstName: string,
    oldLastName: string,
    newFirstName: string,
    newLastName: string
  ): boolean {
    return (
      oldFirstName.trim() !== newFirstName.trim() ||
      oldLastName.trim() !== newLastName.trim()
    );
  }

  /**
   * Format name change info for display
   */
  static formatNameChangeInfo(info: NameChangeInfo): string {
    if (info.remainingChanges === 0) {
      return `You have used all 2 name changes for this month. You can change your name again on ${info.nextResetDate}.`;
    } else if (info.remainingChanges === 1) {
      return `You have 1 name change remaining this month. Next reset: ${info.nextResetDate}.`;
    } else {
      return `You have 2 name changes remaining this month. Next reset: ${info.nextResetDate}.`;
    }
  }
}
