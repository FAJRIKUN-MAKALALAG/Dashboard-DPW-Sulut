import React, { useState } from 'react';
import { Member, MemberStatus } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { SulutMapVisual } from './SulutMapVisual';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building2,
  AlertCircle,
  BarChart3,
  Filter,
} from 'lucide-react';
import { exportMembersToExcel } from '../utils/excelUtils';

interface ExecutiveDashboardProps {
  members: Member[];
  onOpenPrintReport: () => void;
  onNavigateToMembers: (filterDpd?: string, filterStatus?: MemberStatus) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  members,
  onOpenPrintReport,
  onNavigateToMembers,
}) => {
  const [selectedDpdFilter, setSelectedDpdFilter] = useState<string>('ALL');

  // Filtered members by region if selected
  const scopedMembers =
    selectedDpdFilter === 'ALL'
      ? members
      : members.filter((m) => m.dpd === selectedDpdFilter);

  // Executive calculation: ONLY status "Aktif" is considered real active membership
  const activeMembers = scopedMembers.filter((m) => m.status === 'Aktif');
  const inactiveMembers = scopedMembers.filter((m) => m.status !== 'Aktif');

  const countMeninggal = scopedMembers.filter((m) => m.status === 'Non-Aktif (Meninggal)').length;
  const countPindahPartai = scopedMembers.filter(
    (m) => m.status === 'Non-Aktif (Pindah Partai/Mundur)'
  ).length;
  const countPindahDomisili = scopedMembers.filter(
    (m) => m.status === 'Non-Aktif (Pindah Domisili)'
  ).length;

  const totalRegistered = scopedMembers.length;
  const activePercentage =
    totalRegistered > 0 ? Math.round((activeMembers.length / totalRegistered) * 100) : 0;

  // Aggregate distribution per 15 DPDs for Bar Chart
  const distributionData = SULUT_REGIONS.map((region) => {
    const regMembers = members.filter((m) => m.dpd === region.name);
    const active = regMembers.filter((m) => m.status === 'Aktif').length;
    const inactive = regMembers.length - active;
    return {
      name: region.name,
      id: region.id,
      active,
      inactive,
      total: regMembers.length,
      percentage: regMembers.length > 0 ? Math.round((active / regMembers.length) * 100) : 0,
    };
  }).sort((a, b) => b.active - a.active);

  const maxActiveCount = Math.max(...distributionData.map((d) => d.active), 1);

  return (
    <div className="space-y-6">
      {/* Executive Header Kicker & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Executive Briefing & Monitoring
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              DPW Partai NasDem Sulut · Shadow Database
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Dashboard Eksekutif Keanggotaan Riil NasDem Sulut
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Sistem shadow database mandiri DPW Partai NasDem Sulut secara otomatis hanya memperhitungkan kader yang{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">terkonfirmasi riil Aktif</strong> di lapangan,
            mengeliminasi kader wafat, pindah partai, atau mutasi tanpa terhambat verifikasi birokrasi pusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportMembersToExcel(activeMembers, `ANGGOTA_AKTIF_SULUT_${selectedDpdFilter}.xlsx`)}
            className="btn-white flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            onClick={onOpenPrintReport}
            className="btn-white flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cetak Laporan Atasan</span>
          </button>
        </div>
      </div>

      {/* Scope / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg shadow-xs transition-colors">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Lingkup Wilayah Pantauan:</span>
          <select
            value={selectedDpdFilter}
            onChange={(e) => setSelectedDpdFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Seluruh Sulawesi Utara (15 DPD Kab/Kota)</option>
            {SULUT_REGIONS.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {selectedDpdFilter !== 'ALL' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded font-medium">
              Filter Terpasang: {selectedDpdFilter}
            </span>
            <button
              onClick={() => setSelectedDpdFilter('ALL')}
              className="btn-white text-xs px-2.5 py-1 rounded-md cursor-pointer"
            >
              Reset ke Semua
            </button>
          </div>
        )}
      </div>

      {/* 4 Primary Executive Metrics with Vibrant Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Anggota Aktif Riil (The Primary Metric) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
              Kekuatan Riil Lapangan
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight" data-tabular="true">
              {activeMembers.length.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Kader Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hanya menghitung data berstatus aktif yang terkonfirmasi di tingkat DPC & DPRt.
          </p>
          <button
            onClick={() => onNavigateToMembers(selectedDpdFilter === 'ALL' ? undefined : selectedDpdFilter, 'Aktif')}
            className="btn-white w-full justify-between mt-3.5 text-xs font-medium px-3 py-2 rounded-lg flex items-center cursor-pointer"
          >
            <span>Buka Daftar Anggota Aktif</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 2: Tingkat Keaktifan Validitas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider text-[11px]">
              Tingkat Keaktifan
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight" data-tabular="true">
              {activePercentage}%
            </span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Validitas
            </span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${activePercentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {activeMembers.length} dari {totalRegistered} nama terdata masih aktif di basis teritorial.
          </p>
        </div>

        {/* Metric 3: Non-Aktif Tereliminasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wider text-[11px]">
              Non-Aktif (Tereliminasi)
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
              <UserX className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight" data-tabular="true">
              {inactiveMembers.length}
            </span>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Kader
            </span>
          </div>
          <div className="mt-2.5 text-[11px] space-y-1.5 font-mono">
            <div className="flex justify-between items-center bg-rose-50/80 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
              <span className="text-rose-700 dark:text-rose-300">Wafat:</span>
              <span className="text-rose-800 dark:text-rose-200 font-bold">{countMeninggal}</span>
            </div>
            <div className="flex justify-between items-center bg-purple-50/80 dark:bg-purple-950/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900">
              <span className="text-purple-700 dark:text-purple-300">Pindah Partai:</span>
              <span className="text-purple-800 dark:text-purple-200 font-bold">{countPindahPartai}</span>
            </div>
            <div className="flex justify-between items-center bg-amber-50/80 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
              <span className="text-amber-700 dark:text-amber-300">Pindah Domisili:</span>
              <span className="text-amber-800 dark:text-amber-200 font-bold">{countPindahDomisili}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Cakupan Wilayah Sulut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-500 rounded-xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-semibold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
              Struktur Kepengurusan
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight" data-tabular="true">
              15
            </span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              DPD Kab / Kota
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">167 DPC Kecamatan di Sulut</p>
            <p>Shadow database mandiri se-Sulut</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Anti-Duplikasi NIK Aktif</span>
          </div>
        </div>
      </div>

      {/* Bar Chart: Distribusi Anggota Aktif per DPD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs tracking-wider uppercase">
                Grafik Batang Distribusi
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">15 Kabupaten/Kota</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Sebaran Jumlah Anggota Aktif per DPD
            </h3>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Aktif Riil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-400 rounded-xs"></span>
              <span className="text-rose-700 dark:text-rose-400 font-medium">Non-Aktif</span>
            </div>
          </div>
        </div>

        {/* Horizontal Bar Chart for high clarity */}
        <div className="space-y-2.5">
          {distributionData.map((item, index) => {
            const barWidthPercent = Math.max(Math.round((item.active / maxActiveCount) * 100), 4);
            const isSelected = selectedDpdFilter === item.name;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedDpdFilter(isSelected ? 'ALL' : item.name)}
                className={`group p-2.5 rounded-lg transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-slate-400 dark:text-slate-500 font-mono text-[11px] text-right font-medium">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-medium">
                        Terpilih
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold" data-tabular="true">
                      {item.active} Aktif
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="text-slate-600 dark:text-slate-400" data-tabular="true">
                      {item.total} Total
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">({item.percentage}%)</span>
                  </div>
                </div>

                {/* Bar representation with rich colors */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-300 shadow-xs"
                    style={{ width: `${barWidthPercent}%` }}
                    title={`${item.active} Anggota Aktif`}
                  ></div>
                  {item.inactive > 0 && (
                    <div
                      className="bg-rose-400/80 h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(
                          Math.round((item.inactive / maxActiveCount) * 100),
                          2
                        )}%`,
                      }}
                      title={`${item.inactive} Anggota Non-Aktif`}
                    ></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sulut Map Geographic Interactive Component */}
      <SulutMapVisual
        members={members}
        selectedDpd={selectedDpdFilter}
        onSelectDpd={(dpd) => setSelectedDpdFilter(dpd)}
      />

      {/* Atasan Briefing Callout */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4.5 rounded-xl flex items-start gap-3.5 text-xs text-slate-700 dark:text-slate-300 transition-colors">
        <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-900 dark:text-white">Catatan Operasional untuk Pimpinan / Atasan:</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Data keanggotaan di dashboard ini merupakan data operasional riil. Ketika Admin DPD di 15 Kabupaten/Kota
            memperbarui status kader (misal karena pindah domisili, wafat, atau mundur), sistem
            seketika mengeluarkannya dari kalkulasi Aktif tanpa menunggu rapat atau birokrasi pusat. Ini menjaga
            akurasi data tetap presisi dan siap dipertanggungjawabkan kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
};
