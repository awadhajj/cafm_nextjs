import apiClient from './client';
import { ApiResponse, ApiListResponse } from '@/types/common';
import { ServiceRequest, IssueCategory, Supervisor } from '@/types/work-order';

export const serviceRequestsApi = {
  list: async (params?: Record<string, string>): Promise<ApiListResponse<ServiceRequest>> => {
    const { data } = await apiClient.get('/mobile/service-requests', { params });
    return data;
  },

  myRequests: async (params?: Record<string, string>): Promise<ApiListResponse<ServiceRequest>> => {
    const { data } = await apiClient.get('/mobile/service-requests/my-requests', { params });
    return data;
  },

  serviceTypes: async (): Promise<ApiResponse<{ id: string; label: string }[]>> => {
    const { data } = await apiClient.get('/mobile/service-requests/service-types');
    return data;
  },

  issueCategories: async (): Promise<ApiResponse<IssueCategory[]>> => {
    const { data } = await apiClient.get('/mobile/service-requests/issue-categories');
    return data;
  },

  show: async (id: string): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.get(`/mobile/service-requests/${id}`);
    return data;
  },

  create: async (payload: {
    title: string;
    description: string;
    priority: string;
    service_type_id: string;
    failure_description?: string;
    location_id?: string;
    asset_id?: string;
  }): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.post('/mobile/service-requests', payload);
    return data;
  },

  createWizard: async (formData: FormData): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.post('/mobile/service-requests/wizard', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  uploadImages: async (id: string, formData: FormData): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.post(`/mobile/service-requests/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  publish: async (id: string): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.post(`/mobile/service-requests/${id}/publish`);
    return data;
  },

  availableSupervisors: async (id: string): Promise<ApiResponse<Supervisor[]>> => {
    const { data } = await apiClient.get(`/mobile/service-requests/${id}/available-supervisors`);
    return data;
  },

  assignSupervisor: async (id: string, supervisorId: string): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.post(`/mobile/service-requests/${id}/assign-supervisor`, {
      supervisor_id: supervisorId,
    });
    return data;
  },

  approve: async (id: string, payload?: { planner_notes?: string; allow_off_duty?: boolean }): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.post(`/mobile/service-requests/${id}/approve`, payload);
    return data;
  },

  reject: async (id: string, reason: string): Promise<ApiResponse<ServiceRequest>> => {
    const { data } = await apiClient.post(`/mobile/service-requests/${id}/reject`, {
      rejection_reason: reason,
    });
    return data;
  },
};
