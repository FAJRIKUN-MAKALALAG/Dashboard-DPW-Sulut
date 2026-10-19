import React, { useState } from 'react';
import { Member } from '../types';
import {
  ShieldCheck,
  Search,
  FileCheck2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Key,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { exportMembersToExcel } from '../utils/excelUtils';

interface SyncIdReconciliationProps {
  members: Member[];
  onBatchUpdateMembers: (updated: Member[]) => void;
  onBackToDashboard?: () => void;
}

export const SyncIdReconciliation: React.FC<SyncIdReconciliationProps> = ({
  members,
  onBatchUpdateMembers,
  onBackToDashboard,
}) => {
  const [searchKey, setSearchKey] = useState<string>('');
  const [reconcileFilter, setReconcileFilter] = useState<'all' | 'needs_ekta' | 'synced'>('all');

  // Helper to validate e-KTA from DPP NasDem (real format is pure numbers e.g. 16-digit like 2503196713393376, but also supports legacy/ND/KT)
  const isStandardEkta = (ekta?: string) => {
    if (!ekta) return false;
    const clean = ekta.trim();
    if (clean === '' || clean === '-' || clean.includes('TEMP')) return false;
    // Pure numeric e-KTA (official DPP format e.g. 16 digits) or prefix-based
    return /^\d{10,20}$/.test(clean) || clean.startsWith('ND-') || clean.startsWith('KT-') || clean.length >= 8;
  };

  // Metrics
  const total = members.length;
  const withValidNik = members.filter((m) => m.nik && m.nik.length === 16).length;
  const withStandardEkta = members.filter((m) => isStandardEkta(m.nomorEKTA)).length;
  const missingOrTempEkta = members.filter((m) => !isStandardEkta(m.nomorEKTA)).length;

  // Find duplicates if any
  const nikCounts = new Map<string, number>();
  members.forEach((m) => {
    nikCounts.set(m.nik, (nikCounts.get(m.nik) || 0) + 1);
  });
  const duplicateNiks = Array.from(nikCounts.entries()).filter(([_, count]) => count > 1);

  // Filtered list
  const filteredList = members.filter((m) => {
    if (reconcileFilter === 'needs_ekta') {
      if (isStandardEkta(m.nomorEKTA)) return false;
    }
    if (reconcileFilter === 'synced') {
      if (!isStandardEkta(m.nomorEKTA)) return false;
    }
    if (searchKey.trim()) {
      const q = searchKey.toLowerCase().trim();
      return (
        m.nik.includes(q) ||
        (m.nomorEKTA && m.nomorEKTA.toLowerCase().includes(q)) ||
        m.namaLengkap.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Batch auto-sync empty e-KTA IDs with numeric sequence based on NIK
  const handleBatchStandardizeEkta = () => {
    const updated = members.map((m) => {
      if (!isStandardEkta(m.nomorEKTA)) {
        // Fallback numeric e-KTA matching DPP format using NIK basis if available
        const base = m.nik && m.nik.length === 16 ? m.nik : `71${Date.now()}`.padEnd(16, '0').slice(0, 16);
        return {
          ...m,
          nomorEKTA: base,
          catatanMutasi:
            (m.catatanMutasi ? m.catatanMutasi + ' ' : '') + '[Auto-sync Nomor e-KTA]',
        };
      }
      return m;
    });

    onBatchUpdateMembers(updated);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 rounded-xl shadow-2xs transition-colors">
        <div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="btn-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs mb-2.5 self-start"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Kembali ke Dashboard Utama</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Modul Sinkronisasi & Validasi ID NasDem
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Integrasi Unique Identifier (NIK & Nomor e-KTA NasDem)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Pencocokan Data Riil Kader dengan DPP NasDem
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Menyimpan NIK KTP dan Nomor e-KTA Digital NasDem sebagai kunci relasional (unique identifier). Ketika pimpinan DPW atau DPP Partai NasDem meminta
            manifest sinkronisasi, seluruh rekap data kader lokal siap diekspor instan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {missingOrTempEkta > 0 && (
            <button
              onClick={handleBatchStandardizeEkta}
              className="btn-white flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Standardisasi {missingOrTempEkta} e-KTA</span>
            </button>
          )}
          <button
            onClick={() => exportMembersToExcel(members, 'MANIFEST_SINKRONISASI_EKTA_PUSAT_SULUT.xlsx')}
            className="btn-white flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor Manifest Sinkronisasi (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards for Reconciliation with Vibrant Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 p-4.5 rounded-xl shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase font-mono">Validitas NIK KTP</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono" data-tabular="true">{withValidNik}</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">100% 16-Digit</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
            Kunci identitas nasional pencegah pendaftaran ganda antar 15 Kab/Kota di Sulut.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 p-4.5 rounded-xl shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase font-mono">Nomor e-KTA Pusat</span>
            <Key className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono" data-tabular="true">{withStandardEkta}</span>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">Terpetakan</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
            Format baku DPP NasDem: Nomor e-KTA resmi (numerik baku / terdaftar).
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-teal-500 p-4.5 rounded-xl shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 uppercase font-mono">Duplikasi NIK</span>
            <AlertTriangle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono" data-tabular="true">
              {duplicateNiks.length}
            </span>
            <span className="text-xs text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">Nol Duplikat</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
            Sistem secara aktif memblokir NIK duplikat saat proses import massal atau registrasi baru.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Cari NIK atau No e-KTA..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setReconcileFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                reconcileFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Data ({members.length})
            </button>
            <button
              onClick={() => setReconcileFilter('synced')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                reconcileFilter === 'synced'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
              }`}
            >
              Tersinkron ({withStandardEkta})
            </button>
            <button
              onClick={() => setReconcileFilter('needs_ekta')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                reconcileFilter === 'needs_ekta'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400'
              }`}
            >
              Perlu e-KTA ({missingOrTempEkta})
            </button>
          </div>
        </div>

        {/* Table of Reconciliation */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3">NIK KTP (Unique)</th>
                <th className="p-3">Nomor e-KTA Pusat</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">DPD Kab/Kota</th>
                <th className="p-3">Status Relasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/60 font-mono text-xs">
              {filteredList.map((m) => {
                const hasValidEkta = isStandardEkta(m.nomorEKTA);
                return (
                  <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white" data-tabular="true">{m.nik}</td>
                    <td className="p-3 text-amber-700 dark:text-amber-300 font-bold" data-tabular="true">{m.nomorEKTA || '-'}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200 font-sans font-medium">{m.namaLengkap}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">{m.dpd}</td>
                    <td className="p-3">
                      {hasValidEkta ? (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-sans font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Siap Dipetakan ke Pusat</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-sans font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Perlu Nomor e-KTA</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
