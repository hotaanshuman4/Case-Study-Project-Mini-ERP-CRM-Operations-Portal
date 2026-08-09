import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
};

// ─── Users API ─────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/users', { params }),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/users', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/users/${id}`, data),
  remove: (id: string) =>
    apiClient.delete(`/users/${id}`),
};

// ─── Customers API ─────────────────────────────────────────────────────────────
export const customersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/customers', { params }),
  get: (id: string) =>
    apiClient.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/customers', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/customers/${id}`, data),
  stats: () =>
    apiClient.get('/customers/stats'),
  getFollowUps: (id: string, params?: Record<string, unknown>) =>
    apiClient.get(`/customers/${id}/followups`, { params }),
  addFollowUp: (id: string, note: string) =>
    apiClient.post(`/customers/${id}/followups`, { note }),
};

// ─── Products API ──────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/products', { params }),
  get: (id: string) =>
    apiClient.get(`/products/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/products', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/products/${id}`, data),
  remove: (id: string) =>
    apiClient.delete(`/products/${id}`),
  stats: () =>
    apiClient.get('/products/stats'),
  getStockMovements: (id: string, params?: Record<string, unknown>) =>
    apiClient.get(`/products/${id}/stock-movements`, { params }),
  addStockIn: (id: string, quantity: number, reason?: string) =>
    apiClient.post(`/products/${id}/stock-in`, { quantity, reason }),
};

// ─── Challans API ──────────────────────────────────────────────────────────────
export const challansApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/challans', { params }),
  get: (id: string) =>
    apiClient.get(`/challans/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/challans', data),
  confirm: (id: string) =>
    apiClient.put(`/challans/${id}/confirm`),
  cancel: (id: string) =>
    apiClient.put(`/challans/${id}/cancel`),
  stats: () =>
    apiClient.get('/challans/stats'),
};
