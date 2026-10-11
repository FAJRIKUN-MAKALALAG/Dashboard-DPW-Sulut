import React, { useState } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../data/sulutRegions';
import { getInitials, getAvatarColor } from '../utils/imageUtils';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight,
  Sparkles,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';

interface StatusChangeModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onSaveStatus: (nik: string, newStatus: MemberStatus, reason: string) => void;
}

const PRESET_REASONS: Record<MemberStatus, string[]> = {
  Aktif: [
    'Reaktivasi kembali setelah verifikasi faktual lapangan.',
    'Kader kembali aktif dalam konsolidasi struktur daerah.',
    'Selesai masa penonaktifan sementara.',
  ],
  'Non-Aktif (Meninggal)': [
    'Kader telah wafat / berpulang. Dihapus dari data pemilih riil.',
    'Surat keterangan kematian terkonfirmasi oleh keluarga/DPC.',
  ],
  'Non-Aktif (Pindah Partai/Mundur)': [
    'Tercatat maju sebagai calon atau pengurus di partai politik lain.',
    'Menyerahkan surat pengunduran diri resmi bermaterai.',
    'Mengundurkan diri karena menjadi ASN / pejabat publik netral.',
  ],
  'Non-Aktif (Pindah Domisili)': [
    'Pindah alamat KTP dan domisili ke luar provinsi Sulawesi Utara.',
    'Pindah domisili permanen dan mutasi data ke DPW lain.',
  ],
};

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  member,
  isOpen,
  onClose,
  session,
  onSaveStatus,
}) => {
  if (!isOpen || !member) return null;

  const [selectedStatus, setSelectedStatus] = useState<MemberStatus>(member.status);
  const [reason, setReason] = useState<string>(member.catatanMutasi || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Wajib mengisi keterangan / alasan perubahan status untuk catatan audit.');
      return;
    }

    onSaveStatus(member.nik, selectedStatus, reason.trim());
    onClose();
  };

  const willBeCounted = STATUS_BADGE_CONFIG[selectedStatus].isCountedInExecutive;
  const currentConfig = STATUS_BADGE_CONFIG[member.status];
  const newConfig = STATUS_BADGE_CONFIG[selectedStatus];
  const avatarColor = getAvatarColor(member.namaLengkap);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Pembaruan Status Keanggotaan Kader
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Audit Trail Mandiri DPW Sulut · Soft-Delete Berkas Tanpa Menghilangkan Arsip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Member Visual Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
            <div className="w-14 h-16 rounded-xl overflow-hidden border border-amber-400/60 bg-slate-800 shrink-0 flex items-center justify-center">
              {member.fotoProfilUrl ? (
                <img
                  src={member.fotoProfilUrl}
                  alt={member.namaLengkap}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                >
                  <span className="text-base font-bold font-mono">
                    {getInitials(member.namaLengkap)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {member.namaLengkap}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs shrink-0">
                  {member.nomorEKTA}
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                {member.jabatan}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 font-mono">
                <span>NIK: {member.nik}</span>
                <span>·</span>
                <span>{member.dpd}</span>
              </div>
            </div>
          </div>

          {/* Visual Status Transition (Before -> After) */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Status Saat Ini</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${currentConfig.bgClass} ${currentConfig.textClass} ${currentConfig.borderClass}`}
              >
                {member.status}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Status Baru Dipilih</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${newConfig.bgClass} ${newConfig.textClass} ${newConfig.borderClass}`}
              >
                {selectedStatus}
              </span>
            </div>
          </div>

          {/* Status Radio Choices */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Pilih Status Keanggotaan Baru:
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((st) => {
                const isSelected = selectedStatus === st;
                const config = STATUS_BADGE_CONFIG[st];
                return (
                  <label
                    key={st}
                    onClick={() => {
                      setSelectedStatus(st);
                      setErrorMsg(null);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/80 ring-1 ring-amber-400/40 text-slate-950 dark:text-white'
                        : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={isSelected}
                      onChange={() => setSelectedStatus(st)}
                      className="mt-1 text-amber-500 focus:ring-amber-400 accent-amber-500"
                    />
                    <div className="text-xs flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{st}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-medium ${
                            config.isCountedInExecutive
                              ? 'text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                              : 'text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          {config.isCountedInExecutive ? 'Terhitung di Eksekutif' : 'Dikeluarkan dari Total'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {st === 'Aktif'
                          ? 'Kader aktif dalam konsolidasi struktur dan pemenangan pemilu DPW.'
                          : st === 'Non-Aktif (Meninggal)'
                          ? 'Kader wafat. Otomatis dieliminasi dari daftar pemilih riil tanpa menunggu DPP.'
                          : st === 'Non-Aktif (Pindah Partai/Mundur)'
                          ? 'Maju di partai lain atau telah menyerahkan surat pengunduran diri.'
                          : 'Pindah alamat KTP dan domisili ke luar wilayah Sulawesi Utara.'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Quick Preset Reasons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alasan / Catatan Mutasi Lapangan:
              </label>
              <span className="text-[10px] text-slate-400">Pilih template cepat:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(PRESET_REASONS[selectedStatus] || []).map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setReason(preset)}
                  className="btn-white text-[10px] px-2 py-0.5 rounded-md cursor-pointer hover:border-amber-400 text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ketik keterangan atau pilih template cepat di atas..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
            {errorMsg && <p className="text-[11px] text-rose-600 dark:text-rose-400">{errorMsg}</p>}
          </div>

          {/* Impact preview */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              willBeCounted
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-semibold block">Dampak Real-Time:</span>
              {willBeCounted
                ? 'Anggota ini akan masuk dalam perhitungan Anggota Aktif Sulut di Dashboard Eksekutif Atasan.'
                : 'Anggota ini otomatis dicoret dari hitungan total Aktif di Dashboard Eksekutif Atasan, menjaga laporan faktual tetap akurat.'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-white px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-white px-5 py-2 text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              Simpan Perubahan Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
