import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5069/api';

interface ApiOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

async function request<T = any>(method: string, endpoint: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const token = localStorage.getItem('token');
  
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle auth errors
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if (data.code === 'LICENSE_EXPIRED') {
      throw new Error('Lisans süreniz dolmuştur. Lütfen yönetici ile iletişime geçin.');
    }
    throw new Error('Bu işlem için yetkiniz bulunmuyor.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `İstek başarısız (${response.status})`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiOptions) => request<T>('GET', endpoint, undefined, options),
  post: <T = any>(endpoint: string, body?: unknown, options?: ApiOptions) => request<T>('POST', endpoint, body, options),
  put: <T = any>(endpoint: string, body?: unknown, options?: ApiOptions) => request<T>('PUT', endpoint, body, options),
  delete: <T = any>(endpoint: string, options?: ApiOptions) => request<T>('DELETE', endpoint, undefined, options),
};

export default api;
