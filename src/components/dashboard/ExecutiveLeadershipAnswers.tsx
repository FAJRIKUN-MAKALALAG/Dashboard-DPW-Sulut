import React, { useState } from 'react';
import { Member } from '../../types';
import {
  computeStructureReadiness,
  computeDpcReadinessForDpd,
  TerritoryReadiness,
  getMemberSubOrgCategory,
} from '../../utils/structureReadinessUtils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  ShieldCheck,
  Building2,
  MapPin,
  Table,
  ChevronDown,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface ExecutiveLeadershipAnswersProps {
  members: Member[];
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string) => void;
  onOpenStructureModal?: (dpd?: string, level?: 'ALL' | 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const ExecutiveLeadershipAnswers: React.FC<ExecutiveLeadershipAnswersProps> = ({
  members,
  onOpenTerritorialMatrix,
  onOpenStructureModal,
}) => {
  const readinessSummary = computeStructureReadiness(members);
  const [filterTab, setFilterTab] = useState<'ALL' | 'LENGKAP' | 'SEBAGIAN' | 'KOSONG'>('ALL');
  const [expandedDpd, setExpandedDpd] = useState<string | null>(null);

  // Filtered DPD list based on active tab
  const filteredDpds = readinessSummary.dpdList.filter((dpd) => {
    if (filterTab === 'ALL') return true;
    return dpd.status === filterTab;
  });

  const toggleDpdExpand = (dpdName: string) => {
    setExpandedDpd((prev) => (prev === dpdName ? null : dpdName));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 transition-colors">
      {/* Header Banner - Khusus Menjawab Pertanyaan Pimpinan DPW */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Pemetaan Keterisian Wilayah
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-mono">Sulawesi Utara</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Struktur Keanggotaan dan pengurus
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
            Pemetakan daerah (DPD Kab/Kota, DPC Kecamatan, DPRt Desa) yang strukturnya sudah{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Lengkap</strong>,{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-semibold">Sebagian</strong>, atau{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-semibold">Belum Terisi</strong>.
          </p>
        </div>

        {/* Action Button: Matriks Modal */}
        {onOpenTerritorialMatrix && (
          <button
            onClick={() => onOpenTerritorialMatrix()}
            className="btn-white shrink-0 self-start lg:self-auto text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-xs cursor-pointer"
          >
            <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Buka Matriks Struktur & Input Template</span>
          </button>
        )}
      </div>

      {/* 3 Executive Answer Cards (Direct Q&A Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Answer 1: Total Anggota Aktif & Komposisi */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
              1. Jumlah Anggota Aktif
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {readinessSummary.totalMembersActive.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Kader Aktif Riil</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Pengurus Ber-SK (Struktural):
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {readinessSummary.totalPengurusBerSk} Org
              </span>
            </div>
            {/* Rincian Organ: Pimpinan, Pertimbangan, Pakar */}
            <div className="pl-5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center justify-between">
                <span>&bull; Dewan Pimpinan:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {members.filter((m) => m.status === 'Aktif' && m.isPengurus && getMemberSubOrgCategory(m) === 'PIMPINAN').length} Org
                </span>
              </div>
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                <span>&bull; Dewan Pertimbangan:</span>
                <span className="font-mono font-bold">
                  {members.filter((m) => m.status === 'Aktif' && m.isPengurus && getMemberSubOrgCategory(m) === 'PERTIMBANGAN').length} Org
                </span>
              </div>
              <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
                <span>&bull; Dewan Pakar:</span>
                <span className="font-mono font-bold">
                  {members.filter((m) => m.status === 'Aktif' && m.isPengurus && getMemberSubOrgCategory(m) === 'PAKAR').length} Org
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Anggota Biasa (Basis KTP):
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {readinessSummary.totalAnggotaBiasa} Org
              </span>
            </div>
          </div>
        </div>

        {/* Answer 2: Kesiapan Struktur 15 DPD */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
              2. Kesiapan 15 DPD Kab/Kota
            </span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {readinessSummary.fullyCompletedDpds.length}
              <span className="text-lg text-slate-400"> / 15</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {readinessSummary.fullyCompletedDpds.length > 0 ? 'Lengkap 100%' : 'Dalam Proses'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Lengkap (36 Jabatan):
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {readinessSummary.fullyCompletedDpds.length} DPD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Sebagian Terisi:
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {readinessSummary.partiallyFilledDpds.length} DPD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Belum Terisi SK:
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {readinessSummary.emptyDpds.length} DPD
              </span>
            </div>
          </div>
        </div>

        {/* Answer 3: Kesiapan DPC Kecamatan & DPRt Desa */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
              3. Penetrasi DPC & DPRt
            </span>
            <MapPin className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {readinessSummary.completedDpcCount}
              <span className="text-lg text-slate-400"> / {readinessSummary.totalDpcCount}</span>
            </span>
            <span className="text-xs text-slate-500">DPC Kecamatan Ber-SK</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Target DPC Se-Sulut:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                167 Kecamatan
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">DPRt Basis Kel/Desa Ber-SK:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {readinessSummary.completedDprtCount} DPRt
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Standar Jabatan Per DPC:</span>
              <span className="font-mono font-medium">17 Jabatan Inti</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & DPD Mapping Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Daftar Pemetaan 15 DPD Kab/Kota:
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua (15)
            </button>
            <button
              onClick={() => setFilterTab('LENGKAP')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === 'LENGKAP'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lengkap ({readinessSummary.fullyCompletedDpds.length})</span>
            </button>
            <button
              onClick={() => setFilterTab('SEBAGIAN')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === 'SEBAGIAN'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Perlu Dilengkapi ({readinessSummary.partiallyFilledDpds.length})</span>
            </button>
            <button
              onClick={() => setFilterTab('KOSONG')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === 'KOSONG'
                  ? 'bg-rose-600 text-white font-bold shadow-2xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Belum Terisi ({readinessSummary.emptyDpds.length})</span>
            </button>
          </div>
        </div>

        {/* DPD Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDpds.map((dpd) => {
            const isExpanded = expandedDpd === dpd.name;
            const dpcList = isExpanded ? computeDpcReadinessForDpd(dpd.name, members) : [];

            return (
              <div
                key={dpd.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs space-y-3"
              >
                {/* Header DPD Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      {dpd.name}
                    </h5>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Target: {dpd.totalRequired} Jabatan SK
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      dpd.status === 'LENGKAP'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : dpd.status === 'SEBAGIAN'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {dpd.status === 'LENGKAP'
                      ? '✓ Lengkap'
                      : dpd.status === 'SEBAGIAN'
                      ? `${dpd.totalFilled}/${dpd.totalRequired} Terisi`
                      : 'Belum Terisi'}
                  </span>
                </div>

                {/* Progress Bar Keterisian */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Keterisian Jabatan:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {dpd.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        dpd.percentage >= 100
                          ? 'bg-emerald-500'
                          : dpd.percentage > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(dpd.percentage, 2)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Info Text: Kurang Berapa Jabatan */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {dpd.status === 'LENGKAP' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Semua 36 jabatan terisi lengkap
                    </span>
                  ) : dpd.status === 'SEBAGIAN' ? (
                    <span>
                      Masih kosong <strong className="text-amber-600 dark:text-amber-400">{dpd.totalEmpty}</strong> jabatan
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 italic">
                      Template kosong, siap diisi data pengurus
                    </span>
                  )}
                </div>

                {/* Action Buttons: Matriks Tabel & Drilldown DPC */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  {onOpenTerritorialMatrix && (
                    <button
                      onClick={() => onOpenTerritorialMatrix(dpd.name)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title={`Buka tabel matriks ${dpd.name}`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Buka Tabel Matriks</span>
                    </button>
                  )}

                  <button
                    onClick={() => toggleDpdExpand(dpd.name)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Tutup DPC' : 'Rincian DPC'}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>

                {/* Expanded DPC List for this DPD */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Status DPC Kecamatan di {dpd.name}:
                    </span>
                    {dpcList.map((dpc) => (
                      <div
                        key={dpc.id}
                        onClick={() => onOpenTerritorialMatrix && onOpenTerritorialMatrix(dpd.name, dpc.name)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer text-xs group"
                        title={`Klik untuk buka tabel matriks DPC Kec. ${dpc.name}`}
                      >
                        <span className="text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
                          Kec. {dpc.name}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              dpc.status === 'LENGKAP'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : dpc.status === 'SEBAGIAN'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {dpc.totalFilled} / {dpc.totalRequired}
                          </span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
