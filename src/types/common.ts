export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
  errors?: Record<string, string[]>;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface User {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  permissions: string[];
  roles: { name: string }[];
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
}
