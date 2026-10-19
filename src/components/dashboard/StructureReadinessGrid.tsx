import React, { useState } from 'react';
import { Member } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, getMemberSubOrgCategory } from '../../utils/structureReadinessUtils';
import {
  Users,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Table,
  MapPin,
  ShieldCheck,
  Info,
  Sparkles,
  Award,
} from 'lucide-react';

interface StructureReadinessGridProps {
  members: Member[];
  onOpenStructureModal: (dpdName: string) => void;
  onOpenAllStructureModal: () => void;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
}

export const StructureReadinessGrid: React.FC<StructureReadinessGridProps> = ({
  members,
  onOpenStructureModal,
  onOpenAllStructureModal,
  onOpenTerritorialMatrix,
}) => {
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Peta Kesiapan SK & Kelengkapan Organisasi
            </span>
            <span className="text-slate-400 dark:text-slate-600">&middot;</span>
            <span className="text-xs text-slate-500 font-mono">15 Kab/Kota Se-Sulut</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Status Struktur Kepengurusan DPW &rarr; DPD &rarr; DPC &rarr; DPRt
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem pendataan terintegrasi: memantau legalitas SK, keterisian 34 jabatan DPD, 17 jabatan DPC kecamatan, dan DPRt desa.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="btn-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
            title="Tampilkan / Sembunyikan Panduan Standar Data Yang Harus Diisi"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>{showGuidelines ? 'Tutup Panduan SK' : 'Panduan Data SK'}</span>
            {showGuidelines ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={onOpenAllStructureModal}
            className="btn-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shadow-2xs"
            title="Buka daftar seluruh pejabat struktural ber-SK se-Sulut"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Daftar Seluruh Pengurus Ber-SK</span>
          </button>
        </div>
      </div>

      {/* Panduan Data Yang Harus Diisi (Checklist Standar Pendataan Organisasi) */}
      {showGuidelines && (
        <div className="p-4 sm:p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200">
                  📋 Standar & Rincian Data Yang Wajib Diisi Untuk Legalitas Organisasi
                </h4>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Agar kepengurusan diakui resmi ber-SK dan memiliki hak referral rekrutmen kader, data berikut wajib dilengkapi:
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200">
              Standar DPW NasDem Sulut
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Box 1: Legalitas SK */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40 space-y-1.5 shadow-2xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-400">
                <Award className="w-3.5 h-3.5" />
                1. Legalitas Formal SK
              </span>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Nomor SK Resmi</strong> (contoh: SK-DPD-014/2024)</li>
                <li><strong>Tanggal Penetapan SK</strong></li>
                <li><strong>Masa Bakti Kepengurusan</strong></li>
                <li>Wilayah Penugasan Resmi</li>
              </ul>
            </div>

            {/* Box 2: Struktur DPD (34 Jabatan) */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40 space-y-1.5 shadow-2xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                2. Susunan 34 Jabatan DPD
              </span>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>KSB Inti</strong> (Ketua, Sekretaris, Bendahara)</li>
                <li><strong>26 Wakil Ketua Bidang</strong> (Bappilu, OKK, dll)</li>
                <li>Wakil Sekretaris & Bendahara</li>
                <li><strong>Dewan Pertimbangan & Pakar</strong> (4 org)</li>
              </ul>
            </div>

            {/* Box 3: Struktur DPC & DPRt */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40 space-y-1.5 shadow-2xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
                3. DPC & DPRt Basis Desa
              </span>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>DPC Kecamatan</strong>: 17 Jabatan Inti</li>
                <li><strong>DPRt Desa/Kel</strong>: 7-11 Jabatan Ranting</li>
                <li>Penetrasi 100% kecamatan & desa</li>
                <li>Keterisian per TPS/lingkungan</li>
              </ul>
            </div>

            {/* Box 4: Data Wajib Kader */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40 space-y-1.5 shadow-2xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <Users className="w-3.5 h-3.5" />
                4. Biodata Lengkap Pengurus
              </span>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>NIK KTP 16-Digit</strong> (valid & anti-duplikat)</li>
                <li><strong>Nomor e-KTA</strong> resmi NasDem</li>
                <li><strong>Nomor HP/WA & Email</strong> aktif</li>
                <li>Foto Profil & Scan e-KTP resmi</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 15 Kab/Kota Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SULUT_REGIONS.map((region) => {
          const regMembers = members.filter((m) => isDpdMatch(m.dpd, region.name) && m.status === 'Aktif');
          const regPengurus = regMembers.filter((m) => m.isPengurus);
          const dpcCount = region.subdistricts.length;
          const filledDpcs = new Set(
            regPengurus.filter((m) => m.tingkatKepengurusan === 'DPC').map((m) => m.dpc)
          ).size;

          const dpdPengurus = regPengurus.filter(
            (m) =>
              m.tingkatKepengurusan === 'DPD' ||
              !m.dpc ||
              m.dpc === 'Umum (DPD)' ||
              m.dpc === 'Wilayah DPD'
          );
          const countPim = dpdPengurus.filter((m) => getMemberSubOrgCategory(m) === 'PIMPINAN').length;
          const countPert = dpdPengurus.filter((m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN').length;
          const countPak = dpdPengurus.filter((m) => getMemberSubOrgCategory(m) === 'PAKAR').length;
          const totalDpdFilled = countPim + countPert + countPak;
          const dpdTarget = 34; // Standar formasi SK DPD
          const dpdPercent = Math.min(100, Math.round((totalDpdFilled / dpdTarget) * 100));

          const countDprt = regPengurus.filter((m) => m.tingkatKepengurusan === 'DPRt').length;

          return (
            <div
              key={region.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs space-y-3.5 flex flex-col justify-between"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {region.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Zona: {region.zone || 'Sulawesi Utara'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      totalDpdFilled >= dpdTarget
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : totalDpdFilled > 0
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {totalDpdFilled >= dpdTarget
                      ? '✓ Lengkap 100%'
                      : totalDpdFilled > 0
                      ? `${totalDpdFilled}/${dpdTarget} Terisi`
                      : 'Belum Ada SK'}
                  </span>
                </div>

                {/* Progress Bar Keterisian DPD */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Keterisian Jabatan DPD:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {dpdPercent}% ({totalDpdFilled}/{dpdTarget})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        dpdPercent >= 100
                          ? 'bg-emerald-500'
                          : dpdPercent > 0
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(dpdPercent, 2)}%` }}
                    />
                  </div>
                </div>

                {/* Metrik Detail 3 Tingkatan */}
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">1. Struktur DPD (Kab/Kota):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {totalDpdFilled} / {dpdTarget} Posisi
                    </span>
                  </div>
                  <div className="pl-3 flex flex-wrap items-center gap-1 text-[9.5px]">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      Pimpinan: <strong>{countPim}/36</strong>
                    </span>
                    <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                      Pertimbangan: <strong>{countPert}/4</strong>
                    </span>
                    <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-900/40">
                      Pakar: <strong>{countPak}/4</strong>
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-medium">2. Cakupan DPC (Kecamatan):</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {filledDpcs} / {dpcCount} Kec
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium">3. Pengurus DPRt (Ranting Desa):</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {countDprt} Pengurus
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-500">Total Kader Aktif Wilayah:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {regMembers.length} Kader
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Navigasi Langsung Spesifik Wilayah */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {onOpenTerritorialMatrix && (
                    <button
                      onClick={() => onOpenTerritorialMatrix(region.name, undefined, 'DPD')}
                      className="btn-white text-[10px] font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer shadow-2xs"
                      title={`Buka tabel pengurus DPD ${region.name} untuk input & pendataan`}
                    >
                      <Table className="w-3 h-3 text-blue-600" />
                      <span>Input DPD</span>
                    </button>
                  )}

                  {onOpenTerritorialMatrix && (
                    <button
                      onClick={() => onOpenTerritorialMatrix(region.name, region.subdistricts[0]?.name, 'DPC')}
                      className="btn-white text-[10px] font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
                      title={`Buka struktur DPC kecamatan di ${region.name}`}
                    >
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>Kecamatan ({filledDpcs}/{dpcCount})</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onOpenStructureModal(region.name)}
                  className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                  title={`Lihat daftar rincian ${regPengurus.length} pengurus ber-SK ${region.name}`}
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span>Rincian Pengurus Terdata ({regPengurus.length})</span>
                  </span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StructureReadinessGrid;
