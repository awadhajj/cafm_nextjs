import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { WorkOrder } from '@/types/work-order';
import { Reservation } from '@/types/reservation';

export const workOrdersApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<WorkOrder>> => {
    const { data } = await apiClient.get('/mobile/work-orders', { params });
    return data;
  },

  show: async (id: string): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.get(`/mobile/work-orders/${id}`);
    return data;
  },

  create: async (payload: Partial<WorkOrder>): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.post('/mobile/work-orders', payload);
    return data;
  },

  update: async (id: string, payload: Partial<WorkOrder>): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.put(`/mobile/work-orders/${id}`, payload);
    return data;
  },

  start: async (id: string): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/start`);
    return data;
  },

  complete: async (id: string, payload: {
    actual_hours: number;
    completion_notes: string;
  }): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/complete`, payload);
    return data;
  },

  verify: async (id: string, payload: {
    verified: boolean;
    quality_rating: number;
    verification_notes?: string;
  }): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/verify`, payload);
    return data;
  },

  updateStatus: async (id: string, payload: {
    status: string;
    notes?: string;
  }): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/update-status`, payload);
    return data;
  },

  assignStaff: async (id: string, staffIds: string[]): Promise<ApiResponse<WorkOrder>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/assign-staff`, { staff_ids: staffIds });
    return data;
  },

  logTime: async (id: string, payload: { hours: number; notes?: string }): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/log-time`, payload);
    return data;
  },

  timerStatus: async (id: string): Promise<ApiResponse<{
    has_active_timer: boolean;
    timer?: { id: string; started_at: string };
  }>> => {
    const { data } = await apiClient.get(`/mobile/work-orders/${id}/timer-status`);
    return data;
  },

  startTimer: async (id: string): Promise<ApiResponse<{ timer: { id: string; started_at: string } }>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/start-timer`);
    return data;
  },

  stopTimer: async (id: string, notes?: string): Promise<ApiResponse<{
    timer: { id: string; started_at: string; ended_at: string; hours: number };
  }>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/stop-timer`, { notes });
    return data;
  },

  requestCancellation: async (id: string, reason: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/request-cancellation`, { reason });
    return data;
  },

  approveCancellation: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/approve-cancellation`);
    return data;
  },

  rejectCancellation: async (id: string, reason: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/reject-cancellation`, { reason });
    return data;
  },

  reservations: async (id: string): Promise<ApiResponse<Reservation[]>> => {
    const { data } = await apiClient.get(`/mobile/work-orders/${id}/reservations`);
    return data;
  },

  uploadImages: async (id: string, formData: FormData): Promise<ApiResponse<string[]>> => {
    const { data } = await apiClient.post(`/mobile/work-orders/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  byLocation: async (locationId: string): Promise<ApiListResponse<WorkOrder>> => {
    const { data } = await apiClient.get(`/mobile/work-orders/by-location/${locationId}`);
    return data;
  },

  byAsset: async (assetId: string): Promise<ApiListResponse<WorkOrder>> => {
    const { data } = await apiClient.get(`/mobile/work-orders/by-asset/${assetId}`);
    return data;
  },
};
