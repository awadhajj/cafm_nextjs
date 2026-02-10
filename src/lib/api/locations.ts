import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { Location, LocationImage, LocationTree } from '@/types/location';

export const locationsApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<Location>> => {
    const { data } = await apiClient.get('/mobile/locations', { params });
    return data;
  },

  show: async (id: string): Promise<ApiResponse<Location>> => {
    const { data } = await apiClient.get(`/mobile/locations/${id}`);
    return data;
  },

  create: async (payload: Partial<Location>): Promise<ApiResponse<Location>> => {
    const { data } = await apiClient.post('/mobile/locations', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Location>): Promise<ApiResponse<Location>> => {
    const { data } = await apiClient.put(`/mobile/locations/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete(`/mobile/locations/${id}`);
    return data;
  },

  getTree: async (id: string): Promise<ApiResponse<LocationTree>> => {
    const { data } = await apiClient.get(`/mobile/locations/${id}/tree`);
    return data;
  },

  getFullTree: async (): Promise<ApiResponse<LocationTree[]>> => {
    const { data } = await apiClient.get('/mobile/locations-tree');
    return data;
  },

  findByQrCode: async (qrcode: string): Promise<ApiResponse<Location>> => {
    const { data } = await apiClient.get(`/mobile/locations/qrcode/${qrcode}`);
    return data;
  },

  // Images
  getImages: async (id: string): Promise<ApiResponse<LocationImage[]>> => {
    const { data } = await apiClient.get(`/mobile/locations/${id}/images`);
    return data;
  },

  uploadImage: async (id: string, formData: FormData): Promise<ApiResponse<LocationImage>> => {
    const { data } = await apiClient.post(`/mobile/locations/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (id: string, imageId: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete(`/mobile/locations/${id}/images/${imageId}`);
    return data;
  },

  reorderImages: async (id: string, imageIds: string[]): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/locations/${id}/images/reorder`, { image_ids: imageIds });
    return data;
  },

  // Mapping
  getMapping: async (id: string): Promise<ApiResponse<{ latitude: number; longitude: number }>> => {
    const { data } = await apiClient.get(`/mobile/locations/${id}/mapping`);
    return data;
  },

  setMapping: async (id: string, coords: { latitude: number; longitude: number }): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/locations/${id}/mapping`, coords);
    return data;
  },
};
