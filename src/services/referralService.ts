import { apiFetch } from './http';
import {
  MyReferralProfile,
  ReferralValidationResult,
  ReferralTrackingData,
} from '../types';
import { mapApiMember } from './apiMappers';

export const referralService = {
  /**
   * Mengambil profil referral unik milik akun yang sedang login,
   * lengkap dengan informasi Ketua Langsung hierarkis dan statistik rekrutmen.
   */
  async getMyReferralProfile(): Promise<MyReferralProfile> {
    return apiFetch<MyReferralProfile>('/referrals/my-code');
  },

  /**
   * Validasi real-time kode referral saat calon anggota mendaftar.
   * Mengembalikan validitas, data perekrut, dan ketua langsungnya.
   */
  async validateReferralCode(code: string): Promise<ReferralValidationResult> {
    const cleanCode = encodeURIComponent(code.trim().toUpperCase());
    try {
      return await apiFetch<ReferralValidationResult>(`/referrals/validate/${cleanCode}`, {
        auth: false,
      });
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Kode referral tidak ditemukan atau tidak aktif.',
      };
    }
  },

  /**
   * Mengambil data rekap tracking rekrutmen referral:
   * - myRecruits: Anggota yang direkrut langsung oleh pengguna.
   * - teamRecruits: Rekapitulasi tim di bawah supervisi pimpinan/ketua langsung.
   * - leaderboard: Peringkat perekrut paling aktif.
   */
  async getReferralTracking(): Promise<ReferralTrackingData> {
    const data = await apiFetch<any>('/referrals/tracking');
    return {
      myStats: data.myStats || {
        kodeReferral: '',
        totalDirect: 0,
        totalTeam: 0,
        isLeader: false,
      },
      myRecruits: Array.isArray(data.myRecruits) ? data.myRecruits.map(mapApiMember) : [],
      teamRecruits: Array.isArray(data.teamRecruits) ? data.teamRecruits.map(mapApiMember) : [],
      leaderboard: data.leaderboard || [],
    };
  },
};
