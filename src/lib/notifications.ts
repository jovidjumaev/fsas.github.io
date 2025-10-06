/**
 * Notifications Service
 * Handles all notification-related operations
 */

import { supabase, supabaseAdmin } from './supabase';
import { Json } from '@/types/database';

export type NotificationType = 
  | 'attendance_reminder'
  | 'attendance_marked'
  | 'class_cancelled'
  | 'class_rescheduled'
  | 'grade_posted'
  | 'assignment_due'
  | 'announcement'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  class_id: string | null;
  session_id: string | null;
  metadata: Json | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  link?: string;
  classId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export class NotificationService {
  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      console.log('🔔 Fetching notifications for user:', userId);
      
      const response = await fetch(`http://localhost:3001/api/notifications?user_id=${userId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('❌ API error:', result.error);
        return [];
      }

      console.log('✅ Fetched notifications:', result.data?.length || 0, 'notifications');
      return result.data || [];
    } catch (error: any) {
      console.error('❌ Exception in getUserNotifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      console.log('🔔 Fetching unread count for user:', userId);
      
      const response = await fetch(`http://localhost:3001/api/notifications/unread-count?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('❌ API error:', result.error);
        return 0;
      }

      console.log('✅ Unread count:', result.count);
      return result.count || 0;
    } catch (error: any) {
      console.error('❌ Exception in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Get unread notifications
   */
  static async getUnreadNotifications(userId: string, limit = 20): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching unread notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', notificationIds);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markMultipleAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting all notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAllNotifications:', error);
      return false;
    }
  }

  /**
   * Create a notification (admin/system only)
   */
  static async createNotification(params: CreateNotificationParams): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          priority: params.priority || 'medium',
          link: params.link,
          class_id: params.classId,
          session_id: params.sessionId,
          metadata: params.metadata || {},
          expires_at: params.expiresAt
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time notifications
   */
  static unsubscribeFromNotifications(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      attendance_reminder: '📅',
      attendance_marked: '✓',
      class_cancelled: '❌',
      class_rescheduled: '🔄',
      grade_posted: '📝',
      assignment_due: '⏰',
      announcement: '📢',
      system: '⚙️'
    };
    return icons[type] || '📬';
  }

  /**
   * Get notification color based on priority
   */
  static getNotificationColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      low: 'text-gray-600 dark:text-gray-400',
      medium: 'text-blue-600 dark:text-blue-400',
      high: 'text-orange-600 dark:text-orange-400',
      urgent: 'text-red-600 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }
}

