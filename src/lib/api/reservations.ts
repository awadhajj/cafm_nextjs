import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { Reservation, ReservationItem } from '@/types/reservation';

export const reservationsApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<Reservation>> => {
    const { data } = await apiClient.get('/mobile/warehouse/reservations', { params });
    return data;
  },

  show: async (id: string): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.get(`/mobile/warehouse/reservations/${id}`);
    return data;
  },

  create: async (payload: {
    store_id: string;
    requested_date: string;
    comments?: string;
    work_order_id?: string;
    work_order_number?: string;
    ppm_work_order_id?: string;
    ppm_work_order_number?: string;
    items: { item_id: string; requested_quantity: number; remarks?: string }[];
  }): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.post('/mobile/warehouse/reservations', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Reservation>): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.put(`/mobile/warehouse/reservations/${id}`, payload);
    return data;
  },

  approve: async (id: string): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.post(`/mobile/warehouse/reservations/${id}/approve`);
    return data;
  },

  reject: async (id: string, reason: string): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.post(`/mobile/warehouse/reservations/${id}/reject`, { reason });
    return data;
  },

  issue: async (id: string, payload: {
    received_by?: string;
    issuance_date?: string;
    items: Record<string, { issued_quantity: number; remarks?: string }>;
  }): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.post(`/mobile/warehouse/reservations/${id}/issue`, payload);
    return data;
  },

  returnMaterials: async (id: string, payload: {
    items: Record<string, { return_quantity: number; return_notes?: string }>;
  }): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.post(`/mobile/warehouse/reservations/${id}/return`, payload);
    return data;
  },

  addMaterial: async (id: string, payload: {
    item_id: string;
    requested_quantity: number;
    remarks?: string;
  }): Promise<ApiResponse<ReservationItem>> => {
    const { data } = await apiClient.post(`/mobile/warehouse/reservations/${id}/materials`, payload);
    return data;
  },

  updateMaterial: async (id: string, itemId: string, payload: {
    requested_quantity: number;
    remarks?: string;
  }): Promise<ApiResponse<ReservationItem>> => {
    const { data } = await apiClient.put(`/mobile/warehouse/reservations/${id}/materials/${itemId}`, payload);
    return data;
  },

  removeMaterial: async (id: string, itemId: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete(`/mobile/warehouse/reservations/${id}/materials/${itemId}`);
    return data;
  },

  checkStock: async (payload: { item_id: string; store_id: string }): Promise<ApiResponse<{
    item: string;
    available_stock: number;
    unit_price: number;
  }>> => {
    const { data } = await apiClient.post('/mobile/warehouse/reservations/check-stock', payload);
    return data;
  },

  storeSignature: async (id: string, signatureBase64: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/warehouse/reservations/${id}/signature`, {
      signature: signatureBase64,
    });
    return data;
  },
};
