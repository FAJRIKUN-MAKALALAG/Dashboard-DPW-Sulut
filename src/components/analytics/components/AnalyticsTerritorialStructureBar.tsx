import React from 'react';
import { Member } from '../../../types';
import { SULUT_REGIONS } from '../../../data/sulutRegions';
import { isDpdMatch, isDpcMatch } from '../../../utils/structureReadinessUtils';
import { AnalyticsData } from '../types';
import { Building2, CheckCircle2, MapPin, X, ChevronRight } from 'lucide-react';

interface AnalyticsTerritorialStructureBarProps {
  analyticsData: AnalyticsData;
  members: Member[];
  fmt: (n: number) => string;
  territoryBreakdownTab: 'DPD' | 'DPC' | 'DPRt' | null;
  setTerritoryBreakdownTab: React.Dispatch<React.SetStateAction<'DPD' | 'DPC' | 'DPRt' | null>>;
  breakdownZoneFilter: 'ALL' | 'Daratan Minahasa' | 'BMR' | 'Kepulauan';
  setBreakdownZoneFilter: React.Dispatch<React.SetStateAction<'ALL' | 'Daratan Minahasa' | 'BMR' | 'Kepulauan'>>;
  onSelectDpcForDrawer: (dpdName: string, dpcName: string) => void;
}

export const AnalyticsTerritorialStructureBar: React.FC<AnalyticsTerritorialStructureBarProps> = ({
  analyticsData,
  members,
  fmt,
  territoryBreakdownTab,
  setTerritoryBreakdownTab,
  breakdownZoneFilter,
  setBreakdownZoneFilter,
  onSelectDpcForDrawer,
}) => {
  const { totalDpdOfficial, totalDpcOfficial, totalDprtOfficial, coveredDpcCount, coveredDprtCount } = analyticsData;
  const dpcCoveragePct = totalDpcOfficial > 0 ? ((coveredDpcCount / totalDpcOfficial) * 100).toFixed(1) : '0';
  const dprtCoveragePct = totalDprtOfficial > 0 ? ((coveredDprtCount / totalDprtOfficial) * 100).toFixed(1) : '0';

  // Filter regions based on zone filter if set
  const filteredRegions = SULUT_REGIONS.filter((region) => {
    if (breakdownZoneFilter === 'ALL') return true;
    return region.zone === breakdownZoneFilter;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 mb-6 space-y-4">
      {/* Header Title with Subtitle for Ketua DPW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Informasi Struktur Teritorial Resmi Sulawesi Utara
              </h2>
              <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/80 text-[10px] font-mono font-bold uppercase">
                Panduan Eksekutif Ketua DPW
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Basis Data Administrasi Resmi Tingkat DPD (Kab/Kota), DPC (Kecamatan), dan DPRt (Desa/Kelurahan) se-Sulut
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>15 DPD &bull; 171 DPC &bull; 1.602 DPRt</span>
        </div>
      </div>

      {/* 3 Executive Answer Cards (Interactive Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: DPD KABUPATEN / KOTA */}
        <div
          onClick={() => setTerritoryBreakdownTab((prev) => (prev === 'DPD' ? null : 'DPD'))}
          className={`p-4 rounded-md bg-zinc-900/90 border transition-all flex flex-col justify-between cursor-pointer group ${
            territoryBreakdownTab === 'DPD'
              ? 'border-blue-500 ring-1 ring-blue-500/50 bg-zinc-900 shadow-md'
              : 'border-zinc-800 hover:border-blue-700/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
                Tingkat Kab / Kota
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Terbentuk
              </span>
            </div>

            {/* Explicit Q&A format answering Ketua DPW */}
            <div className="text-[11px] text-zinc-400 font-medium mb-1 flex items-start gap-1">
              <span className="text-blue-400 font-bold">T:</span>
              <span>&ldquo;Berapa jumlah semua DPD di Sulawesi Utara?&rdquo;</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {totalDpdOfficial}
                </span>
                <span className="text-sm font-bold text-blue-400 ml-1.5 uppercase font-mono">
                  DPD
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-300 font-bold block">
                  11 Kab &bull; 4 Kota
                </span>
                <span className="text-[10px] text-emerald-400 font-mono block">
                  15 DPD 100% Terdata
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">15 DPD berstatus definitif</span>
            <span className="text-blue-400 font-semibold flex items-center gap-1">
              {territoryBreakdownTab === 'DPD' ? 'Tutup Rincian ↑' : 'Buka 15 DPD ↓'}
            </span>
          </div>
        </div>

        {/* CARD 2: DPC KECAMATAN */}
        <div
          onClick={() => setTerritoryBreakdownTab((prev) => (prev === 'DPC' ? null : 'DPC'))}
          className={`p-4 rounded-md bg-zinc-900/90 border transition-all flex flex-col justify-between cursor-pointer group ${
            territoryBreakdownTab === 'DPC'
              ? 'border-amber-500 ring-1 ring-amber-500/50 bg-zinc-900 shadow-md'
              : 'border-zinc-800 hover:border-amber-700/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                Tingkat Kecamatan
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                {coveredDpcCount} / {totalDpcOfficial} Terisi ({dpcCoveragePct}%)
              </span>
            </div>

            {/* Explicit Q&A format answering Ketua DPW */}
            <div className="text-[11px] text-zinc-400 font-medium mb-1 flex items-start gap-1">
              <span className="text-amber-400 font-bold">T:</span>
              <span>&ldquo;Berapa jumlah semua DPC yang ada di Sulut?&rdquo;</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {totalDpcOfficial}
                </span>
                <span className="text-sm font-bold text-amber-400 ml-1.5 uppercase font-mono">
                  DPC
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-300 font-bold block">
                  171 Kecamatan
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono block">
                  {coveredDpcCount} DPC Terjangkau Kader
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Total 171 Kecamatan se-Sulut</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              {territoryBreakdownTab === 'DPC' ? 'Tutup Rincian ↑' : 'Lihat Sebaran 15 DPD ↓'}
            </span>
          </div>
        </div>

        {/* CARD 3: DPRT DESA & KELURAHAN */}
        <div
          onClick={() => setTerritoryBreakdownTab((prev) => (prev === 'DPRt' ? null : 'DPRt'))}
          className={`p-4 rounded-md bg-zinc-900/90 border transition-all flex flex-col justify-between cursor-pointer group ${
            territoryBreakdownTab === 'DPRt'
              ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-zinc-900 shadow-md'
              : 'border-zinc-800 hover:border-emerald-700/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                Tingkat Desa / Kelurahan
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {coveredDprtCount} / {fmt(totalDprtOfficial)} Terisi ({dprtCoveragePct}%)
              </span>
            </div>

            {/* Explicit Q&A format answering Ketua DPW */}
            <div className="text-[11px] text-zinc-400 font-medium mb-1 flex items-start gap-1">
              <span className="text-emerald-400 font-bold">T:</span>
              <span>&ldquo;Berapa semua DPRt yang ada di Sulut?&rdquo;</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {fmt(totalDprtOfficial)}
                </span>
                <span className="text-sm font-bold text-emerald-400 ml-1.5 uppercase font-mono">
                  DPRt
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-300 font-bold block">
                  1.507 Desa &bull; 95 Kel
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono block">
                  {coveredDprtCount} DPRt Terjangkau Kader
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Total 1.602 Desa & Kelurahan</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              {territoryBreakdownTab === 'DPRt' ? 'Tutup Rincian ↑' : 'Lihat Sebaran 15 DPD ↓'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* INTERACTIVE TERRITORIAL DRILLDOWN SECTION (SEBARAN 171 DPC / 1.602 DPRt) */}
      {/* ==================================================================== */}
      {territoryBreakdownTab && (
        <div className="pt-4 border-t border-zinc-800/80 space-y-4 animate-in fade-in duration-200">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {territoryBreakdownTab === 'DPC'
                    ? 'Sebaran 171 DPC Kecamatan di 15 DPD Kabupaten / Kota'
                    : territoryBreakdownTab === 'DPRt'
                    ? 'Sebaran 1.602 DPRt Desa & Kelurahan di 15 DPD Kabupaten / Kota'
                    : 'Daftar 15 DPD Kabupaten & Kota Se-Sulawesi Utara'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Klik pada tombol nama <strong>Kecamatan (DPC)</strong> di bawah untuk membuka Micro-Page rincian seluruh desa/kelurahan (DPRt).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Zone Filter Buttons */}
              <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
                <button
                  onClick={() => setBreakdownZoneFilter('ALL')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    breakdownZoneFilter === 'ALL'
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Semua ({SULUT_REGIONS.length} DPD)
                </button>
                <button
                  onClick={() => setBreakdownZoneFilter('Daratan Minahasa')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    breakdownZoneFilter === 'Daratan Minahasa'
                      ? 'bg-blue-950 text-blue-300 font-bold border border-blue-800/80'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Minahasa (7)
                </button>
                <button
                  onClick={() => setBreakdownZoneFilter('BMR')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    breakdownZoneFilter === 'BMR'
                      ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800/80'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  BMR (5)
                </button>
                <button
                  onClick={() => setBreakdownZoneFilter('Kepulauan')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    breakdownZoneFilter === 'Kepulauan'
                      ? 'bg-sky-950 text-sky-300 font-bold border border-sky-800/80'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Kepulauan (3)
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setTerritoryBreakdownTab(null)}
                className="px-3 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Tutup rincian sebaran"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* 15 DPD Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredRegions.map((region) => {
              const totalDpcInDpd = region.subdistricts.length;
              const totalDprtInDpd = region.subdistricts.reduce((sum, s) => sum + s.villages.length, 0);

              // Count how many subdistricts in this DPD have cadres
              const coveredDpcCountInDpd = region.subdistricts.filter((sub) => {
                return members.some(
                  (m) =>
                    isDpdMatch(m.dpd, region.name) &&
                    isDpcMatch(m.dpc, sub.name) &&
                    m.status === 'Aktif'
                );
              }).length;

              return (
                <div
                  key={region.name}
                  className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-2.5"
                >
                  {/* Header DPD */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {region.name}
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Zona: {region.zone} &bull; {region.type}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-amber-300 border border-zinc-700/80 block">
                        {totalDpcInDpd} DPC &bull; {totalDprtInDpd} DPRt
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                        {coveredDpcCountInDpd} / {totalDpcInDpd} Kec Terjangkau
                      </span>
                    </div>
                  </div>

                  {/* DPC Kecamatan Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-zinc-800/80">
                    {region.subdistricts.map((sub) => {
                      const subCadres = members.filter(
                        (m) =>
                          isDpdMatch(m.dpd, region.name) &&
                          isDpcMatch(m.dpc, sub.name) &&
                          m.status === 'Aktif'
                      );
                      const isCovered = subCadres.length > 0;

                      return (
                        <button
                          key={sub.name}
                          onClick={() =>
                            onSelectDpcForDrawer(region.name, sub.name)
                          }
                          className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center justify-between gap-1.5 border transition-all text-left cursor-pointer group ${
                            isCovered
                              ? 'bg-zinc-900 border-zinc-700/80 text-zinc-200 hover:border-amber-500 hover:text-white hover:bg-zinc-800'
                              : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900'
                          }`}
                          title={`Klik untuk membuka rincian ${sub.villages.length} DPRt di Kec. ${sub.name}`}
                        >
                          <span className="truncate font-medium text-[11px] group-hover:text-amber-400">
                            Kec. {sub.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                            <span className="text-zinc-500">{sub.villages.length} Desa</span>
                            {isCovered ? (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                title={`${subCadres.length} kader aktif`}
                              />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" title="Belum ada kader" />
                            )}
                            <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regional Breakdown Mini Matrix */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-3 flex-wrap font-mono text-[11px]">
          <span className="text-zinc-500 font-bold uppercase tracking-wider">Rincian Zona Resmi:</span>
          <span className="text-blue-400">
            <strong>Daratan Minahasa:</strong> 7 DPD &bull; 88 DPC &bull; 816 DPRt
          </span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-amber-400">
            <strong>BMR:</strong> 5 DPD &bull; 39 DPC &bull; 438 DPRt
          </span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-sky-400">
            <strong>Kepulauan:</strong> 3 DPD &bull; 44 DPC &bull; 348 DPRt
          </span>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          SUMBER: KEMENDAGRI &bull; BPS SULUT &bull; DPW NASDEM SULUT
        </div>
      </div>
    </div>
  );
};
