/**
 * Konfigurasi koneksi frontend ke backend (Flask).
 * Seluruh akses database & kredensial layanan eksternal sekarang berada di backend.
 */
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_BASE_URL: string = String(rawApiUrl)
  .replace(/^["']|["']$/g, '')
  .trim()
  .replace(/\/+$/, '');

export const isBackendConfigured = (): boolean => Boolean(API_BASE_URL);
