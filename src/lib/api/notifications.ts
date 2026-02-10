import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { Notification, NotificationStatistics, NotificationPreferences } from '@/types/notification';

export const notificationsApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<Notification>> => {
    const { data } = await apiClient.get('/mobile/notifications', { params });
    return data;
  },

  statistics: async (): Promise<ApiResponse<NotificationStatistics>> => {
    const { data } = await apiClient.get('/mobile/notifications/statistics');
    return data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/notifications/${id}/read`);
    return data;
  },

  markAllRead: async (): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/mobile/notifications/mark-all-read');
    return data;
  },

  executeAction: async (id: string, action: string): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.post(`/mobile/notifications/${id}/action`, { action });
    return data;
  },

  registerDevice: async (token: string, platform: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/mobile/notifications/device/register', { token, platform });
    return data;
  },

  unregisterDevice: async (token: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/mobile/notifications/device/unregister', { token });
    return data;
  },

  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
    const { data } = await apiClient.get('/mobile/notifications/preferences');
    return data;
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post('/mobile/notifications/preferences', prefs);
    return data;
  },
};
