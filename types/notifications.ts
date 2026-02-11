import type { UserRole } from '@/types/users';

export interface Notification {
  id: string;
  notification_type: {
    id: string;
    name: string;
    description: string;
  };
  message: string;
  start_date: string;
  end_date: string;
  target_role: NotificationRole;
  status: NotificationStatus;
  created_at: string;
  updated_at: string;
  read: boolean;
}

export type NotificationRole = 'All' | UserRole;
export type NotificationStatus = 'Active' | 'Expired' | 'Scheduled';
