import React, { useState } from 'react';
import { DeletionRequest, UserSession } from '../types';
import {
  X,
  ShieldCheck,
  Check,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  FileText,
  Filter,
  Trash2,
} from 'lucide-react';

interface DeletionApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: DeletionRequest[];
  session: UserSession;
  onApprove: (requestId: string, notes?: string) => void;
  onReject: (requestId: string, notes: string) => void;
}

export const DeletionApprovalModal: React.FC<DeletionApprovalModalProps> = ({
  isOpen,
  onClose,
  requests,
  session,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');

  if (!isOpen) return null;

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const historyRequests = requests.filter((r) => r.status !== 'PENDING');

  const displayedRequests = activeTab === 'PENDING' ? pendingRequests : historyRequests;

  const handleStartAction = (reqId: string, type: 'APPROVE' | 'REJECT') => {
    setActioningId(reqId);
    setActionType(type);
    setReviewNote(type === 'APPROVE' ? 'Disetujui dan dihapus permanen oleh DPW.' : '');
  };

  const handleCancelAction = () => {
    setActioningId(null);
    setActionType(null);
    setReviewNote('');
  };

  const handleConfirmAction = (reqId: string) => {
    if (actionType === 'APPROVE') {
      onApprove(reqId, reviewNote);
    } else if (actionType === 'REJECT') {
      if (!reviewNote.trim()) {
        alert('Harap isi alasan penolakan permohonan.');
        return;
      }
      onReject(reqId, reviewNote.trim());
    }
    handleCancelAction();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Panel Verifikasi &amp; Persetujuan Hapus Data
                  </h3>
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                      {pendingRequests.length} Menunggu
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Otoritas Super Admin DPW Partai NasDem Sulawesi Utara
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            onClick={() => {
              setActiveTab('PENDING');
              handleCancelAction();
            }}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'PENDING'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Persetujuan ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('HISTORY');
              handleCancelAction();
            }}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Riwayat Selesai ({historyRequests.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {displayedRequests.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === 'PENDING'
                  ? 'Tidak ada permohonan penghapusan yang menunggu verifikasi'
                  : 'Belum ada riwayat permohonan penghapusan'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {activeTab === 'PENDING'
                  ? 'Semua data kader dalam kondisi sinkron dan tidak ada pengajuan hapus dari DPD, DPC, maupun DPRt.'
                  : 'Permohonan yang telah Anda setujui atau tolak akan diarsipkan di sini.'}
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Request Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {req.requestedByRole === 'ADMIN_DPD'
                        ? 'Pengajuan DPD'
                        : req.requestedByRole === 'ADMIN_DPC'
                        ? 'Pengajuan DPC'
                        : 'Pengajuan DPRt'}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {req.requestedByName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{req.requestedAt}</span>
                  </div>
                </div>

                {/* Member Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Data Kader yang Diminta Hapus
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {req.memberName}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      NIK: {req.memberNik} &bull; e-KTA: {req.memberNomorEKTA || '-'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Status: {req.statusMember}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Wilayah Teritorial
                    </span>
                    <div className="mt-0.5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <p><strong>DPD:</strong> {req.dpd}</p>
                      <p><strong>DPC:</strong> Kec. {req.dpc}</p>
                      <p><strong>DPRt:</strong> {req.dprt}</p>
                    </div>
                  </div>
                </div>

                {/* Official Statement / Reason */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-500" />
                    Pernyataan &amp; Alasan Penghapusan dari Daerah:
                  </span>
                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic">
                    &ldquo;{req.reason}&rdquo;
                  </div>
                </div>

                {/* Review status or Action controls */}
                {req.status === 'PENDING' ? (
                  actioningId === req.id ? (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {actionType === 'APPROVE'
                          ? 'Konfirmasi Persetujuan Hapus Permanen (Catatan Tambahan Opsional):'
                          : 'Alasan Penolakan Permohonan (Wajib Diisi):'}
                      </label>
                      <input
                        type="text"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder={
                          actionType === 'APPROVE'
                            ? 'Catatan verifikasi DPW...'
                            : 'Contoh: Berkas pengunduran diri belum lengkap, silakan verifikasi fisik dahulu...'
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelAction}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmAction(req.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-sm ${
                            actionType === 'APPROVE'
                              ? 'bg-rose-600 hover:bg-rose-500'
                              : 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-800'
                          }`}
                        >
                          {actionType === 'APPROVE' ? (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Ya, Setujui &amp; Hapus Permanen</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak Permohonan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleStartAction(req.id, 'REJECT')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tolak</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartAction(req.id, 'APPROVE')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui &amp; Hapus Data</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {req.status === 'APPROVED' ? 'Telah Disetujui & Dihapus' : 'Ditolak oleh DPW'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Diverifikasi: {req.reviewedBy || 'DPW'} &bull; {req.reviewedAt}
                      {req.reviewNotes && ` (${req.reviewNotes})`}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Penghapusan data yang disetujui akan menghapus data kader secara permanen dari database.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
