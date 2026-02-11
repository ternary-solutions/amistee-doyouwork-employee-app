import type { Notification } from '@/types/notifications';
import type { UserNotificationList } from '@/types/userNotifications';
import { apiRequest } from '@/utils/api';

export const notificationsService = {
  async getById(id: string): Promise<Notification> {
    return apiRequest<unknown, Notification>(
      `notifications/${id}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async getMyNotifications(
    page = 1,
    limit = 25,
    search?: string,
    unread_only = false
  ): Promise<UserNotificationList> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unread_only: unread_only.toString(),
    });
    if (search) queryParams.append('search', search);
    return apiRequest<unknown, UserNotificationList>(
      `notifications/my?${queryParams.toString()}`,
      { method: 'GET' },
      true,
      true
    );
  },

  async markAsRead(notificationId: string): Promise<void> {
    return apiRequest<unknown, void>(
      `notifications/${notificationId}/read`,
      { method: 'POST' },
      true,
      true
    );
  },
};
