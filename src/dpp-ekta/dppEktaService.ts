import { API_BASE_URL } from '../config/api';
import { apiFetch } from '../services/http';
import { mapApiMember } from '../services/apiMappers';
import { Member } from '../types';

export interface DppConnectionStatus {
  configured: boolean;
  connected: boolean;
  adminEmail?: string;
  baseUrl?: string;
  message: string;
}

export interface DppWilayahItem {
  id_wilayah: string;
  name: string;
}

export interface DppCheckKtpResponse {
  nik: string;
  existsInDpp: boolean;
  existsInLocal: boolean;
  localMember?: any;
}

export interface DppCreateKtaPayload {
  nik: string;
  namaLengkap: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  golonganDarah?: string;
  statusPerkawinan?: string;
  pekerjaan?: string;
  agama?: string;
  pendidikan?: string;
  sayap?: string;
  dpd?: string;
  dpc?: string;
  dprt?: string;
  kabupatenId?: string;
  kecamatanId?: string;
  kelurahanId?: string;
  rtNumber?: string;
  rwNumber?: string;
  alamatLengkap?: string;
  nomorHP?: string;
  email?: string;
  password?: string;
  fotoKtpUrl?: string;
  fotoProfilUrl?: string;
  saveToLocalMembers?: boolean;
}

export interface DppCreateKtaResult {
  success: boolean;
  nomor_ekta?: string;
  alreadyRegistered?: boolean;
  overview_id?: string;
  email?: string;
  password?: string;
  kta_card_base64?: string;
  message?: string;
  error?: string;
  member?: any;
}

export const DPP_PENDIDIKAN_OPTIONS = [
  { value: '4', label: 'SMA / SMU / Sederajat' },
  { value: '5', label: 'SMK / Kejuruan' },
  { value: '10', label: 'S1 / Sarjana' },
  { value: '8', label: 'D3 / Diploma III' },
  { value: '9', label: 'D4 / Diploma IV' },
  { value: '11', label: 'S2 / Pasca Sarjana' },
  { value: '12', label: 'S3 / Doktoral' },
  { value: '3', label: 'SMP / Sederajat' },
  { value: '2', label: 'SD / Sederajat' },
  { value: '0', label: 'Lain-Lain' },
];

export const DPP_STATUS_KAWIN_OPTIONS = [
  { value: 'B', label: 'Belum Kawin' },
  { value: 'S', label: 'Sudah Kawin' },
  { value: 'P', label: 'Pernah Kawin (Cerai)' },
];

export const DPP_GOL_DARAH_OPTIONS = ['O', 'A', 'B', 'AB'];

export const DPP_SAYAP_OPTIONS = [
  { value: '', label: '- Tanpa Sayap / Umum -' },
  { value: '1', label: 'Garda Pemuda NasDem' },
  { value: '2', label: 'Garnita Malahayati NasDem' },
  { value: '3', label: 'BAHU NasDem' },
  { value: '4', label: 'Liga Mahasiswa NasDem' },
  { value: '5', label: 'Petani NasDem' },
  { value: '6', label: 'Gemuruh NasDem' },
  { value: '7', label: 'Rescue NasDem' },
  { value: '8', label: 'Nelayan NasDem' },
];

export const dppEktaService = {
  async getStatus(): Promise<DppConnectionStatus> {
    return apiFetch<DppConnectionStatus>('/dpp/status');
  },

  async getWilayah(params?: {
    kabupatenId?: string;
    kecamatanId?: string;
  }): Promise<{ level: string; items: DppWilayahItem[] }> {
    return apiFetch<{ level: string; items: DppWilayahItem[] }>('/dpp/wilayah', {
      query: {
        kabupaten_id: params?.kabupatenId,
        kecamatan_id: params?.kecamatanId,
      },
    });
  },

  async checkKtp(nik: string): Promise<DppCheckKtpResponse> {
    return apiFetch<DppCheckKtpResponse>('/dpp/check-ktp', {
      method: 'POST',
      body: { nik },
    });
  },

  async createKta(payload: DppCreateKtaPayload): Promise<{
    result: DppCreateKtaResult;
    mappedMember?: Member;
  }> {
    const result = await apiFetch<DppCreateKtaResult>('/dpp/create-kta', {
      method: 'POST',
      body: payload,
    });
    const mappedMember = result.member ? mapApiMember(result.member) : undefined;
    return { result, mappedMember };
  },

  getKtaCardUrl(nokta: string, download = false): string {
    const clean = (nokta || '').replace(/[^0-9]/g, '');
    return `${API_BASE_URL}/dpp/kta-card/${encodeURIComponent(clean)}${download ? '?download=1' : ''}`;
  },

  /**
   * Mendeteksi apakah nomor e-KTA anggota sudah berupa nomor resmi terbitan DPP
   * (berbeda dari NIK 16 digit kader tersebut).
   */
  hasOfficialDppEkta(member: Pick<Member, 'nik' | 'nomorEKTA'>): boolean {
    const cleanNik = (member.nik || '').replace(/[^0-9]/g, '');
    const cleanEkta = (member.nomorEKTA || '').replace(/[^0-9]/g, '');
    return Boolean(cleanEkta && cleanEkta.length >= 12 && cleanEkta !== cleanNik);
  },
};

export function isOfficialDppEkta(nomorEkta?: string | null, nik?: string | null): boolean {
  const raw = (nomorEkta || '').trim();
  if (!raw || raw.toUpperCase().startsWith('NSD-')) return false;
  const cleanEkta = raw.replace(/[^0-9]/g, '');
  const cleanNik = (nik || '').replace(/[^0-9]/g, '');
  if (cleanNik && cleanEkta === cleanNik) return false;
  return cleanEkta.length >= 12;
}

export function getDppKtaCardUrl(nokta: string, download = false): string {
  return dppEktaService.getKtaCardUrl(nokta, download);
}

