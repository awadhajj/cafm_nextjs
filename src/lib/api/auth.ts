import apiClient from './client';
import { User } from '@/types/common';

interface LoginPayload {
  email: string;
  password: string;
  subdomain: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/mobile/login', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/mobile/logout');
  },

  me: async (): Promise<{ success: boolean; data: User }> => {
    const { data } = await apiClient.get('/mobile/me');
    return data;
  },
};
