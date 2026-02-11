export interface UserNotification {
  id?: string;
  notification_id?: string;
  message: string;
  type: string;
  notification_type?: {
    id: string;
    name: string;
    description?: string;
  };
  unread_count?: number;
  created_at: string;
  read?: boolean;
}

export interface UserNotificationList {
  items: UserNotification[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
