import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach auth token and set tenant base URL
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenant = localStorage.getItem('tenant_subdomain');
    if (tenant) {
      const host = process.env.NEXT_PUBLIC_API_HOST || 'localhost:8002';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      config.baseURL = `${protocol}://${tenant}.${host}/api`;
      config.headers['X-Tenant'] = tenant;
    }
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/login`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
