import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { Asset, AssetImage } from '@/types/asset';

export const assetsApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<Asset>> => {
    const { data } = await apiClient.get('/mobile/assets', { params });
    return data;
  },

  search: async (params?: Record<string, string>): Promise<ApiListResponse<Asset>> => {
    const { data } = await apiClient.get('/mobile/assets/search', { params });
    return data;
  },

  statistics: async (): Promise<ApiResponse<Record<string, number>>> => {
    const { data } = await apiClient.get('/mobile/assets/statistics');
    return data;
  },

  show: async (id: string): Promise<ApiResponse<Asset>> => {
    const { data } = await apiClient.get(`/mobile/assets/${id}`);
    return data;
  },

  create: async (payload: Partial<Asset>): Promise<ApiResponse<Asset>> => {
    const { data } = await apiClient.post('/mobile/assets', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Asset>): Promise<ApiResponse<Asset>> => {
    const { data } = await apiClient.put(`/mobile/assets/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete(`/mobile/assets/${id}`);
    return data;
  },

  findByQrCode: async (qrcode: string): Promise<ApiResponse<Asset>> => {
    const { data } = await apiClient.get(`/mobile/assets/qrcode/${qrcode}`);
    return data;
  },

  // Images
  getImages: async (id: string): Promise<ApiResponse<AssetImage[]>> => {
    const { data } = await apiClient.get(`/mobile/assets/${id}/images`);
    return data;
  },

  uploadImage: async (id: string, formData: FormData): Promise<ApiResponse<AssetImage>> => {
    const { data } = await apiClient.post(`/mobile/assets/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (id: string, imageId: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete(`/mobile/assets/${id}/images/${imageId}`);
    return data;
  },
};
