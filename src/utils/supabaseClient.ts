/**
 * Adapter backward-compatibility: Mengalihkan seluruh pemanggilan supabaseClient lama ke backendClient API.
 */
export * from './backendClient';

// Stub kosong jika ada kode warisan yang membaca properti config
export const supabaseUrl = '';
export const supabaseAnonKey = '';
export const supabase = null as any;
