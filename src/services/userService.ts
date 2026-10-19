import { supabase, isSupabaseConfigured } from '../config/database';
import { AppUser, UserSession, UserRole } from '../types';
import { mapDbRowToAppUser, mapAppUserToDbPayload } from './mappers';
import { DUMMY_ACCOUNTS } from '../data/dummyAccounts';

const LOCAL_STORAGE_USERS_KEY = 'nasdem_sulut_app_users_v1';

// Super Admin Utama Default
export const MASTER_SUPER_ADMIN: AppUser = {
  id: 'master-superadmin-01',
  memberNik: '7106033003050001',
  nomorEkta: 'KT-7106-2024-0001',
  username: '7106033003050001',
  password: 'NasDem15',
  fullName: 'Super Administrator DPW NasDem',
  role: 'SUPER_ADMIN',
  dpdAccess: 'ALL',
  dpcAccess: 'ALL',
  dprtAccess: 'ALL',
  jabatan: 'Super Administrator DPW Partai NasDem Sulut',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

// Local storage helpers for offline / instant load fallback
function getLocalUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) return [MASTER_SUPER_ADMIN];
    const parsed: AppUser[] = JSON.parse(raw);
    if (!parsed.some((u) => u.username === MASTER_SUPER_ADMIN.username)) {
      return [MASTER_SUPER_ADMIN, ...parsed];
    }
    return parsed;
  } catch {
    return [MASTER_SUPER_ADMIN];
  }
}

function saveLocalUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Gagal menyimpan app_users ke localStorage:', e);
  }
}

export const UserService = {
  /**
   * Mengambil semua daftar akun admin dari Supabase (atau fallback localStorage)
   */
  async getAll(): Promise<AppUser[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbRowToAppUser);
          // Pastikan Master Super Admin tetap ada dalam daftar
          if (!mapped.some((u) => u.username === MASTER_SUPER_ADMIN.username)) {
            mapped.unshift(MASTER_SUPER_ADMIN);
          }
          saveLocalUsers(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Gagal query app_users dari Supabase, beralih ke cache lokal:', err);
      }
    }
    return getLocalUsers();
  },

  /**
   * Membuat akun admin baru oleh Super Admin
   */
  async create(user: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppUser> {
    const newUser: AppUser = {
      ...user,
      id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Simpan ke Supabase jika aktif
    if (isSupabaseConfigured() && supabase) {
      try {
        const dbPayload = mapAppUserToDbPayload(newUser);
        const { data, error } = await supabase
          .from('app_users')
          .insert(dbPayload)
          .select()
          .single();

        if (!error && data) {
          newUser.id = String(data.id);
        } else if (error) {
          console.warn('Supabase insert app_users error:', error.message);
        }
      } catch (err) {
        console.error('Error saat menyimpan user ke Supabase:', err);
      }
    }

    // 2. Simpan ke Cache Lokal
    const current = getLocalUsers();
    const updated = [newUser, ...current.filter((u) => u.username !== newUser.username)];
    saveLocalUsers(updated);

    return newUser;
  },

  /**
   * Memperbarui akun admin
   */
  async update(id: string, updates: Partial<AppUser>): Promise<boolean> {
    // 1. Update ke Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const dbPayload = mapAppUserToDbPayload(updates);
        const { error } = await supabase
          .from('app_users')
          .update(dbPayload)
          .eq('id', id);

        if (error) {
          console.warn('Supabase update app_users warning:', error.message);
        }
      } catch (err) {
        console.error('Error saat update user di Supabase:', err);
      }
    }

    // 2. Update Cache Lokal
    const current = getLocalUsers();
    const updated = current.map((u) => (u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u));
    saveLocalUsers(updated);
    return true;
  },

  /**
   * Menghapus akun admin (Super Admin utama tidak dapat dihapus)
   */
  async delete(id: string, username: string): Promise<boolean> {
    if (username === MASTER_SUPER_ADMIN.username || username === '7106033003050001') {
      throw new Error('Akun Super Administrator Utama tidak boleh dihapus demi keamanan sistem.');
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('app_users').delete().eq('id', id);
      } catch (err) {
        console.error('Error menghapus user dari Supabase:', err);
      }
    }

    const current = getLocalUsers();
    const updated = current.filter((u) => u.id !== id && u.username !== username);
    saveLocalUsers(updated);
    return true;
  },

  /**
   * Mengubah status aktif/non-aktif akun
   */
  async toggleStatus(id: string, isActive: boolean): Promise<boolean> {
    return this.update(id, { isActive });
  },

  /**
   * Otentikasi login: NIK / E-KTA / Username dan Password
   */
  async authenticate(
    loginInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; session?: UserSession; message?: string }> {
    const cleanInput = loginInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // 1. Cek Cepat Super Admin Master
    if (
      (cleanInput === MASTER_SUPER_ADMIN.username.toLowerCase() ||
        cleanInput === (MASTER_SUPER_ADMIN.memberNik || '').toLowerCase()) &&
      cleanPass === MASTER_SUPER_ADMIN.password
    ) {
      return {
        success: true,
        session: {
          role: 'SUPER_ADMIN',
          dpdAccess: 'ALL',
          dpcAccess: 'ALL',
          dprtAccess: 'ALL',
          adminName: MASTER_SUPER_ADMIN.fullName,
          adminNik: MASTER_SUPER_ADMIN.memberNik,
          jabatan: MASTER_SUPER_ADMIN.jabatan || 'Super Administrator DPW Sulut',
        },
      };
    }

    // 2. Cek Akun di Database Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .or(`username.ilike.${cleanInput},member_nik.ilike.${cleanInput},nomor_ekta.ilike.${cleanInput}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          const userRow = data[0];
          const appUser = mapDbRowToAppUser(userRow);

          if (appUser.password !== cleanPass) {
            return {
              success: false,
              message: 'Kata sandi (password) salah. Silakan periksa kembali.',
            };
          }

          if (!appUser.isActive) {
            return {
              success: false,
              message: 'Akun Anda telah dinonaktifkan oleh Super Administrator. Hubungi DPW.',
            };
          }

          return {
            success: true,
            session: {
              role: appUser.role,
              dpdAccess: appUser.dpdAccess,
              dpcAccess: appUser.dpcAccess,
              dprtAccess: appUser.dprtAccess,
              adminName: appUser.fullName,
              adminNik: appUser.memberNik || appUser.username,
              jabatan: appUser.jabatan || `Admin ${appUser.role}`,
            },
          };
        }
      } catch (err) {
        console.warn('Error saat query otentikasi di Supabase:', err);
      }
    }

    // 3. Cek Akun di Cache Lokal / State
    const localUsers = getLocalUsers();
    const foundLocal = localUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanInput ||
          (u.memberNik && u.memberNik.toLowerCase() === cleanInput) ||
          (u.nomorEkta && u.nomorEkta.toLowerCase() === cleanInput))
    );

    if (foundLocal) {
      if (foundLocal.password !== cleanPass) {
        return {
          success: false,
          message: 'Kata sandi (password) salah. Silakan periksa kembali.',
        };
      }

      if (!foundLocal.isActive) {
        return {
          success: false,
          message: 'Akun Anda telah dinonaktifkan oleh Super Administrator. Hubungi DPW.',
        };
      }

      return {
        success: true,
        session: {
          role: foundLocal.role,
          dpdAccess: foundLocal.dpdAccess,
          dpcAccess: foundLocal.dpcAccess,
          dprtAccess: foundLocal.dprtAccess,
          adminName: foundLocal.fullName,
          adminNik: foundLocal.memberNik || foundLocal.username,
          jabatan: foundLocal.jabatan || `Admin ${foundLocal.role}`,
        },
      };
    }

    // 4. Fallback Simulasi Demo Accounts (untuk kemudahan testing)
    const foundDummy = DUMMY_ACCOUNTS.find(
      (acc) =>
        (acc.username.toLowerCase() === cleanInput ||
          (acc.nik && acc.nik.toLowerCase() === cleanInput)) &&
        acc.password === cleanPass
    );

    if (foundDummy) {
      return {
        success: true,
        session: foundDummy.session,
      };
    }

    return {
      success: false,
      message: 'Akun tidak ditemukan atau NIK / Password belum terdaftar di sistem hak akses.',
    };
  },
};
