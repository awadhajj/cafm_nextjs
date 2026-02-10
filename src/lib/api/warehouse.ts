import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { Store, Slot, Item } from '@/types/warehouse';

export const warehouseApi = {
  // Stores
  stores: {
    list: async (params?: Record<string, string>): Promise<ApiListResponse<Store>> => {
      const { data } = await apiClient.get('/mobile/warehouse/stores', { params });
      return data;
    },
    search: async (params?: Record<string, string>): Promise<ApiListResponse<Store>> => {
      const { data } = await apiClient.get('/mobile/warehouse/stores/search', { params });
      return data;
    },
    show: async (id: string): Promise<ApiResponse<Store>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/stores/${id}`);
      return data;
    },
    create: async (payload: Partial<Store>): Promise<ApiResponse<Store>> => {
      const { data } = await apiClient.post('/mobile/warehouse/stores', payload);
      return data;
    },
    update: async (id: string, payload: Partial<Store>): Promise<ApiResponse<Store>> => {
      const { data } = await apiClient.put(`/mobile/warehouse/stores/${id}`, payload);
      return data;
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      const { data } = await apiClient.delete(`/mobile/warehouse/stores/${id}`);
      return data;
    },
    findByQrCode: async (qrcode: string): Promise<ApiResponse<Store>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/stores/qrcode/${qrcode}`);
      return data;
    },
  },

  // Slots
  slots: {
    list: async (storeId: string): Promise<ApiListResponse<Slot>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/stores/${storeId}/slots`);
      return data;
    },
    show: async (storeId: string, slotId: string): Promise<ApiResponse<Slot>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/stores/${storeId}/slots/${slotId}`);
      return data;
    },
    create: async (storeId: string, payload: Partial<Slot>): Promise<ApiResponse<Slot>> => {
      const { data } = await apiClient.post(`/mobile/warehouse/stores/${storeId}/slots`, payload);
      return data;
    },
    update: async (storeId: string, slotId: string, payload: Partial<Slot>): Promise<ApiResponse<Slot>> => {
      const { data } = await apiClient.put(`/mobile/warehouse/stores/${storeId}/slots/${slotId}`, payload);
      return data;
    },
    delete: async (storeId: string, slotId: string): Promise<ApiResponse<null>> => {
      const { data } = await apiClient.delete(`/mobile/warehouse/stores/${storeId}/slots/${slotId}`);
      return data;
    },
    findByQrCode: async (qrcode: string): Promise<ApiResponse<Slot>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/slots/qrcode/${qrcode}`);
      return data;
    },
  },

  // Items
  items: {
    list: async (params?: Record<string, string>): Promise<ApiListResponse<Item>> => {
      const { data } = await apiClient.get('/mobile/warehouse/items', { params });
      return data;
    },
    search: async (params?: Record<string, string>): Promise<ApiListResponse<Item>> => {
      const { data } = await apiClient.get('/mobile/warehouse/items/search', { params });
      return data;
    },
    show: async (id: string): Promise<ApiResponse<Item>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/items/${id}`);
      return data;
    },
    create: async (payload: Partial<Item>): Promise<ApiResponse<Item>> => {
      const { data } = await apiClient.post('/mobile/warehouse/items', payload);
      return data;
    },
    update: async (id: string, payload: Partial<Item>): Promise<ApiResponse<Item>> => {
      const { data } = await apiClient.put(`/mobile/warehouse/items/${id}`, payload);
      return data;
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      const { data } = await apiClient.delete(`/mobile/warehouse/items/${id}`);
      return data;
    },
    findByQrCode: async (qrcode: string): Promise<ApiResponse<Item>> => {
      const { data } = await apiClient.get(`/mobile/warehouse/items/qrcode/${qrcode}`);
      return data;
    },
    uploadImage: async (id: string, formData: FormData): Promise<ApiResponse<{ image_path: string; image_url: string }>> => {
      const { data } = await apiClient.post(`/mobile/warehouse/items/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    deleteImage: async (id: string): Promise<ApiResponse<null>> => {
      const { data } = await apiClient.delete(`/mobile/warehouse/items/${id}/image`);
      return data;
    },
  },
};
