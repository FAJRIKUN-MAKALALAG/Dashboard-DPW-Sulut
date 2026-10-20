import { AppUser, UserSession } from '../types';
import { mapApiUser } from './apiMappers';
import { apiFetch, ApiError, setToken, clearToken } from './http';

// Identitas Super Admin utama (hanya untuk menandai akun yang tidak boleh dihapus/dinonaktifkan di UI).
// Kredensial tidak lagi disimpan di frontend; autentikasi dilakukan oleh backend.
export const MASTER_SUPER_ADMIN: AppUser = {
  id: 'master-superadmin-01',
  memberNik: '7106033003050001',
  nomorEkta: 'KT-7106-2024-0001',
  username: '7106033003050001',
  password: '',
  fullName: 'Super Administrator DPW NasDem',
  role: 'SUPER_ADMIN',
  dpdAccess: 'ALL',
  dpcAccess: 'ALL',
  dprtAccess: 'ALL',
  jabatan: 'Super Administrator DPW Partai NasDem Sulut',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

/** Password hanya dikirim bila diisi (kosong = tidak diubah). */
function toApiUserPayload(user: Partial<AppUser>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (user.memberNik !== undefined) payload.memberNik = user.memberNik;
  if (user.nomorEkta !== undefined) payload.nomorEkta = user.nomorEkta;
  if (user.username !== undefined) payload.username = user.username.trim();
  if (user.password) payload.password = user.password.trim();
  if (user.fullName !== undefined) payload.fullName = user.fullName.trim();
  if (user.role !== undefined) payload.role = user.role;
  if (user.dpdAccess !== undefined) payload.dpdAccess = user.dpdAccess;
  if (user.dpcAccess !== undefined) payload.dpcAccess = user.dpcAccess;
  if (user.dprtAccess !== undefined) payload.dprtAccess = user.dprtAccess;
  if (user.jabatan !== undefined) payload.jabatan = user.jabatan;
  if (user.isActive !== undefined) payload.isActive = user.isActive;
  return payload;
}

export const UserService = {
  /** Daftar akun admin (khusus Super Admin di sisi server). */
  async getAll(): Promise<AppUser[]> {
    const res = await apiFetch<{ items: any[] }>('/users');
    return res.items.map(mapApiUser);
  },

  /** Membuat akun admin baru oleh Super Admin. */
  async create(user: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppUser> {
    const created = await apiFetch<any>('/users', { method: 'POST', body: toApiUserPayload(user) });
    return mapApiUser(created);
  },

  /** Memperbarui akun admin. */
  async update(id: string, updates: Partial<AppUser>): Promise<boolean> {
    await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: toApiUserPayload(updates) });
    return true;
  },

  /** Menghapus akun admin (Super Admin utama tidak dapat dihapus). */
  async delete(id: string, username: string): Promise<boolean> {
    if (username === MASTER_SUPER_ADMIN.username) {
      throw new Error('Akun Super Administrator Utama tidak boleh dihapus demi keamanan sistem.');
    }
    await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  },

  /** Mengubah status aktif/non-aktif akun. */
  async toggleStatus(id: string, isActive: boolean): Promise<boolean> {
    return this.update(id, { isActive });
  },

  /** Login ke backend: NIK / E-KTA / Username + Password. Token JWT disimpan untuk request berikutnya. */
  async authenticate(
    loginInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; session?: UserSession; message?: string }> {
    try {
      const res = await apiFetch<{ token: string; session: UserSession }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { username: loginInput.trim(), password: passwordInput.trim() },
      });
      setToken(res.token);
      return { success: true, session: res.session };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, message: err.message };
      return { success: false, message: 'Terjadi kendala saat menghubungi server.' };
    }
  },

  /** Keluar: hapus token sesi. */
  logout(): void {
    clearToken();
  },
};
