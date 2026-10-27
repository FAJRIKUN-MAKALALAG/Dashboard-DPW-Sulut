import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'nasdem_sulut_access_token';

export const AUTH_EXPIRED_EVENT = 'nasdem:auth-expired';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Gagal menyimpan token sesi:', e);
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* abaikan */
  }
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** false = jangan kirim token (mis. login) */
  auth?: boolean;
}

/**
 * Pemanggil API terpusat: menambahkan JWT, menangani error & sesi berakhir (401).
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server backend. Pastikan backend sudah berjalan.', 0);
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* respons tanpa body JSON */
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearToken();
      try {
        localStorage.removeItem('nasdem_sulut_authenticated');
      } catch {
        /* abaikan */
      }
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError((data && data.error) || `Permintaan gagal (HTTP ${res.status})`, res.status);
  }

  return data as T;
}
