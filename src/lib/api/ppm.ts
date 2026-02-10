import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { PpmWorkOrder } from '@/types/ppm';
import { Reservation } from '@/types/reservation';

export const ppmApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.get('/mobile/ppm/work-orders', { params });
    return data;
  },

  show: async (id: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.get(`/mobile/ppm/work-orders/${id}`);
    return data;
  },

  update: async (id: string, payload: Partial<PpmWorkOrder>): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.put(`/mobile/ppm/work-orders/${id}`, payload);
    return data;
  },

  start: async (id: string, notes?: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/start`, { notes });
    return data;
  },

  hold: async (id: string, reason: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/hold`, { reason });
    return data;
  },

  resume: async (id: string, notes?: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/resume`, { notes });
    return data;
  },

  complete: async (id: string, formData: FormData): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  submit: async (id: string, notes?: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/submit`, { notes });
    return data;
  },

  approve: async (id: string, payload: { notes?: string; auto_start?: boolean }): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/approve`, payload);
    return data;
  },

  reject: async (id: string, reason: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/reject`, { reason });
    return data;
  },

  verify: async (id: string, payload: { quality_rating: number; notes?: string }): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/verify`, payload);
    return data;
  },

  acceptWork: async (id: string, payload: { quality_rating: number; notes?: string }): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/accept-work`, payload);
    return data;
  },

  requireRework: async (id: string, reason: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/require-rework`, { reason });
    return data;
  },

  cancel: async (id: string, reason: string): Promise<ApiResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/cancel`, { reason });
    return data;
  },

  logTime: async (id: string, payload: { hours: number; notes?: string }): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/log-time`, payload);
    return data;
  },

  timerStatus: async (id: string): Promise<ApiResponse<{
    has_active_timer: boolean;
    timer?: { id: string; started_at: string; elapsed_minutes?: number };
  }>> => {
    const { data } = await apiClient.get(`/mobile/ppm/work-orders/${id}/timer-status`);
    return data;
  },

  startTimer: async (id: string): Promise<ApiResponse<{ timer: { id: string; started_at: string } }>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/start-timer`);
    return data;
  },

  stopTimer: async (id: string, notes?: string): Promise<ApiResponse<{
    timer: { id: string; hours: number; started_at: string; ended_at: string };
  }>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/stop-timer`, { notes });
    return data;
  },

  reservations: async (id: string): Promise<ApiResponse<Reservation[]>> => {
    const { data } = await apiClient.get(`/mobile/ppm/work-orders/${id}/reservations`);
    return data;
  },

  createReservation: async (id: string, payload: {
    store_id: string;
    requested_date: string;
    comments?: string;
    items: { item_id: string; requested_quantity: number; remarks?: string }[];
  }): Promise<ApiResponse<Reservation>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/reservations`, payload);
    return data;
  },

  uploadImages: async (id: string, formData: FormData): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.post(`/mobile/ppm/work-orders/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  byLocation: async (locationId: string): Promise<ApiListResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.get(`/mobile/ppm/work-orders/by-location/${locationId}`);
    return data;
  },

  byAsset: async (assetId: string): Promise<ApiListResponse<PpmWorkOrder>> => {
    const { data } = await apiClient.get(`/mobile/ppm/work-orders/by-asset/${assetId}`);
    return data;
  },
};
