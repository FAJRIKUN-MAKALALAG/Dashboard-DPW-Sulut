/**
 * Konfigurasi koneksi frontend ke backend (Flask).
 * Seluruh akses database & kredensial layanan eksternal sekarang berada di backend.
 */
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let cleanedUrl = String(rawApiUrl)
  .replace(/^["']|["']$/g, '')
  .trim()
  .replace(/\/+$/, '');

// Normalisasi: jika URL berbentuk domain penuh (misal: 'https://api.nasdemsulut.io')
// dan belum memiliki akhiran '/api', tambahkan '/api' agar selalu sinkron dengan rute backend
if (cleanedUrl && !cleanedUrl.endsWith('/api') && !cleanedUrl.includes('/api/')) {
  cleanedUrl = `${cleanedUrl}/api`;
}

export const API_BASE_URL: string = cleanedUrl;

export const isBackendConfigured = (): boolean => Boolean(API_BASE_URL);
