import React, { useState } from 'react';
import { Member, UserSession } from '../types';
import { X, ShieldAlert, AlertTriangle, Send, FileText, CheckCircle2 } from 'lucide-react';

interface DeletionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  session: UserSession;
  onSubmitRequest: (member: Member, reason: string) => void;
}

export const DeletionRequestModal: React.FC<DeletionRequestModalProps> = ({
  isOpen,
  onClose,
  member,
  session,
  onSubmitRequest,
}) => {
  const [reason, setReason] = useState<string>('');
  const [agreementChecked, setAgreementChecked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 15) {
      setErrorMsg('Pernyataan alasan penghapusan harus diisi minimal 15 karakter secara jelas.');
      return;
    }
    if (!agreementChecked) {
      setErrorMsg('Harap centang konfirmasi pernyataan tanggung jawab.');
      return;
    }

    onSubmitRequest(member, reason.trim());
    setReason('');
    setAgreementChecked(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6 transition-colors animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-200 dark:border-slate-800 bg-amber-500/10 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Permohonan Hapus Data ke DPW
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verifikasi Berjenjang Hak Akses Daerah Partai NasDem Sulut
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Notification Info Banner */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[11.5px]">Kebijakan Keamanan Data DPW:</p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400/90">
                Sebagai <strong>{session.jabatan}</strong>, Anda hanya berhak menambah dan mengubah data. 
                Penghapusan data kader permanen wajib diverifikasi dan disetujui langsung oleh <strong>Super Admin DPW</strong> untuk mencegah penghapusan sepihak atau kehilangan data pemilih riil.
              </p>
            </div>
          </div>

          {/* Member Card Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Data Anggota yang Diajukan untuk Dihapus
            </span>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {member.namaLengkap}
                </h4>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  NIK: {member.nik} &bull; e-KTA: {member.nomorEKTA || '-'}
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {member.status}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>DPD:</strong> {member.dpd}</span>
              <span><strong>DPC:</strong> Kec. {member.dpc}</span>
              <span><strong>DPRt:</strong> {member.dprt}</span>
            </div>
          </div>

          {/* Pernyataan / Alasan Form */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Pernyataan &amp; Alasan Resmi Penghapusan <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400">Wajib diisi</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan secara rinci alasan permohonan penghapusan (contoh: Terjadi duplikasi NIK dengan berkas fisik nomor sekian, atau kader mengundurkan diri secara resmi dan meminta pencabutan data sesuai surat bertanggal...)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Pernyataan ini akan tercatat dalam Audit Log resmi DPW dan ditinjau oleh pimpinan.
            </p>
          </div>

          {/* Konfirmasi Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={agreementChecked}
              onChange={(e) => setAgreementChecked(e.target.checked)}
              className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed select-none">
              Saya menyatakan bahwa keterangan ini dibuat dengan sebenar-benarnya atas nama pengurus daerah dan dapat dipertanggungjawabkan ke DPW Partai NasDem Sulut.
            </span>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Permohonan ke DPW</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
