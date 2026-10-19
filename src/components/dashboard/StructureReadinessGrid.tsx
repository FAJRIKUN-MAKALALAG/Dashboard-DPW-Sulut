import React from 'react';
import { Member } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, getMemberSubOrgCategory } from '../../utils/structureReadinessUtils';
import { Users, ChevronRight } from 'lucide-react';

interface StructureReadinessGridProps {
  members: Member[];
  onOpenStructureModal: (dpdName: string) => void;
  onOpenAllStructureModal: () => void;
}

export const StructureReadinessGrid: React.FC<StructureReadinessGridProps> = ({
  members,
  onOpenStructureModal,
  onOpenAllStructureModal,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Peta Kesiapan SK & Kelengkapan Organisasi
            </span>
            <span className="text-slate-400 dark:text-slate-600">&middot;</span>
            <span className="text-xs text-slate-500 font-mono">15 Kab/Kota Se-Sulut</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Status Struktur Kepengurusan DPW &rarr; DPD &rarr; DPC &rarr; DPRt
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Menjawab kelengkapan legalitas SK, keterisian kecamatan (DPC), dan basis kelurahan/desa (DPRt).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAllStructureModal}
            className="btn-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Daftar Seluruh Pengurus Ber-SK</span>
          </button>
        </div>
      </div>

      {/* 15 Kab/Kota Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          return (
            <div
              key={region.id}
              onClick={() => onOpenStructureModal(region.name)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {region.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    regPengurus.length > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {regPengurus.length > 0 ? `${regPengurus.length} Ber-SK` : 'Belum Ada SK'}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Cakupan DPC Kecamatan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {filledDpcs} / {dpcCount} Kec
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kader Aktif:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {regMembers.length} Kader
                  </span>
                </div>

                {/* Breakdown Organ DPD */}
                <div className="pt-1 flex flex-wrap items-center gap-1 text-[9.5px]">
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
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                <span>Lihat daftar nama & jabatan</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
