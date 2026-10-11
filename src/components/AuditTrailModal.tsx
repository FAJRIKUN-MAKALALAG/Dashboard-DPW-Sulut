import React from 'react';
import { AuditLog } from '../types';
import { X, History, ShieldAlert, UserCheck, ArrowRight, Clock } from 'lucide-react';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <History className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Log Riwayat Audit & Mutasi Keanggotaan
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rekam jejak setiap perubahan status (soft-delete), nama operator, dan alasan operasional lapangan
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

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Belum ada riwayat mutasi yang tercatat.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="text-slate-800 dark:text-slate-300 font-semibold">{log.timestamp}</span>
                    <span>·</span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{log.dpd}</span>
                  </div>
                  <div className="text-slate-500">
                    Oleh: <strong className="text-slate-700 dark:text-slate-300">{log.actor}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{log.memberName}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono ml-2">NIK: {log.memberNik}</span>
                  </div>

                  {log.previousStatus && log.newStatus && (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-700 dark:text-emerald-400 line-through opacity-80">{log.previousStatus}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-rose-700 dark:text-rose-400 font-bold">{log.newStatus}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60 mt-1">
                  <span className="text-slate-500 font-semibold mr-1">Alasan:</span>
                  <span className="italic">{log.reason}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span>Total {logs.length} catatan audit mutasi</span>
          <button
            onClick={onClose}
            className="btn-white px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
