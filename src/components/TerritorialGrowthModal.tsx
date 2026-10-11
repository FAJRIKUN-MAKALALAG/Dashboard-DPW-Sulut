import React, { useState } from 'react';
import { Member } from '../types';
import {
  X,
  Search,
  MapPin,
  Building2,
  Users,
  ChevronRight,
  FileSpreadsheet,
  IdCard,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowLeft,
  Eye,
  CheckCircle2,
  UserCheck,
  Award,
  Filter,
} from 'lucide-react';
import { exportMembersToExcel } from '../utils/excelUtils';
import { DpdGrowthNode, RecruiterNode } from '../utils/growthUtils';

interface TerritorialGrowthModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  territorialTree: DpdGrowthNode[];
  recruitersList: RecruiterNode[];
  allFilteredMembers: Member[];
  initialDpd?: string;
  initialDpc?: string;
  initialDprt?: string;
  initialRecruiter?: string;
  onOpenCardModal?: (member: Member) => void;
}

export const TerritorialGrowthModal: React.FC<TerritorialGrowthModalProps> = ({
  isOpen,
  onClose,
  periodLabel,
  territorialTree,
  recruitersList,
  allFilteredMembers,
  initialDpd,
  initialDpc,
  initialDprt,
  initialRecruiter,
  onOpenCardModal,
}) => {
  const [selectedDpd, setSelectedDpd] = useState<string | null>(initialDpd || null);
  const [selectedDpc, setSelectedDpc] = useState<string | null>(initialDpc || null);
  const [selectedDprt, setSelectedDprt] = useState<string | null>(initialDprt || null);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(initialRecruiter || null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'recruiters' | 'cadres'>('hierarchy');

  // Reset drilldown when modal reopens with new initial props
  React.useEffect(() => {
    if (initialDpd) setSelectedDpd(initialDpd);
    if (initialDpc) setSelectedDpc(initialDpc);
    if (initialDprt) setSelectedDprt(initialDprt);
    if (initialRecruiter) {
      setSelectedRecruiter(initialRecruiter);
      setActiveTab('cadres');
    }
  }, [initialDpd, initialDpc, initialDprt, initialRecruiter, isOpen]);

  if (!isOpen) return null;

  // Filtered members based on current drilldown selection and search query
  const scopedMembers = allFilteredMembers.filter((m) => {
    if (selectedDpd && m.dpd !== selectedDpd) return false;
    if (selectedDpc && m.dpc !== selectedDpc) return false;
    if (selectedDprt && m.dprt !== selectedDprt) return false;
    if (selectedRecruiter && m.kaderPerekrutNama !== selectedRecruiter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = m.namaLengkap.toLowerCase().includes(q);
      const matchNik = m.nik.includes(q);
      const matchEkta = (m.nomorEKTA || '').toLowerCase().includes(q);
      const matchDprt = (m.dprt || '').toLowerCase().includes(q);
      const matchDpc = (m.dpc || '').toLowerCase().includes(q);
      const matchRecruiter = (m.kaderPerekrutNama || '').toLowerCase().includes(q);
      return matchName || matchNik || matchEkta || matchDprt || matchDpc || matchRecruiter;
    }
    return true;
  });

  // Current active DPD node in tree
  const activeDpdNode = territorialTree.find((n) => n.name === selectedDpd);
  // Current active DPC node
  const activeDpcNode = activeDpdNode?.dpcs.find((d) => d.name === selectedDpc);
  // Current active DPRt node
  const activeDprtNode = activeDpcNode?.dprts.find((v) => v.name === selectedDprt);

  const handleExport = () => {
    const filenamePrefix = selectedRecruiter
      ? `REKRUTAN_KADER_${selectedRecruiter.replace(/[^a-zA-Z0-9]/g, '_')}`
      : selectedDprt
      ? `PENAMBAHAN_DPRT_${selectedDprt}`
      : selectedDpc
      ? `PENAMBAHAN_DPC_${selectedDpc}`
      : selectedDpd
      ? `PENAMBAHAN_DPD_${selectedDpd}`
      : 'PENAMBAHAN_KADER_SULUT';
    exportMembersToExcel(scopedMembers, `${filenamePrefix}_${Date.now()}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Audit Rekrutmen Berbasis Kader Lapangan
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {periodLabel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Rincian Anggota Baru Direkrut Oleh Kader (Teritorial KTP)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              disabled={scopedMembers.length === 0}
              className="btn-white text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Excel ({scopedMembers.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Breadcrumb Bar */}
        <div className="bg-slate-100/70 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              onClick={() => {
                setSelectedDpd(null);
                setSelectedDpc(null);
                setSelectedDprt(null);
                setSelectedRecruiter(null);
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                !selectedDpd && !selectedRecruiter
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Seluruh Rekrutan ({allFilteredMembers.length})
            </button>

            {selectedRecruiter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="px-2 py-1 rounded-md font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Kader: {selectedRecruiter}
                </span>
                <button
                  onClick={() => setSelectedRecruiter(null)}
                  className="text-xs text-rose-500 hover:underline ml-1"
                >
                  (Hapus Filter)
                </button>
              </>
            )}

            {selectedDpd && !selectedRecruiter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => {
                    setSelectedDpc(null);
                    setSelectedDprt(null);
                  }}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedDpd && !selectedDpc
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  DPD {selectedDpd} ({activeDpdNode?.count || 0})
                </button>
              </>
            )}

            {selectedDpc && !selectedRecruiter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => setSelectedDprt(null)}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedDpc && !selectedDprt
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  DPC {selectedDpc} ({activeDpcNode?.count || 0})
                </button>
              </>
            )}

            {selectedDprt && !selectedRecruiter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="px-2 py-1 rounded-md font-bold bg-blue-600 text-white">
                  DPRt {selectedDprt} ({activeDprtNode?.count || 0})
                </span>
              </>
            )}
          </div>

          {/* Quick Back Level Button */}
          {(selectedDpd || selectedDpc || selectedDprt || selectedRecruiter) && (
            <button
              onClick={() => {
                if (selectedRecruiter) setSelectedRecruiter(null);
                else if (selectedDprt) setSelectedDprt(null);
                else if (selectedDpc) setSelectedDpc(null);
                else if (selectedDpd) setSelectedDpd(null);
              }}
              className="btn-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Reset / Kembali</span>
            </button>
          )}
        </div>

        {/* Filter and View Mode Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari anggota, kader perekrut, NIK, desa..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'hierarchy'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Struktur Teritorial KTP
              </button>
              <button
                onClick={() => setActiveTab('recruiters')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'recruiters'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Kader Perekrut ({recruitersList.length})
              </button>
              <button
                onClick={() => setActiveTab('cadres')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'cadres'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Daftar Rekrutan ({scopedMembers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: STRUCTURE HIERARCHY TREE */}
          {activeTab === 'hierarchy' && (
            <div>
              {/* Level 1: When no DPD is selected */}
              {!selectedDpd && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Pilih DPD Kabupaten / Kota (Domisili KTP Anggota Baru)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Klik pada kabupaten/kota untuk melihat rincian penambahan per DPC (Kecamatan) & kader yang merekrut.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      {territorialTree.length} Daerah Terpenetrasi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {territorialTree.map((dpdNode) => (
                      <div
                        key={dpdNode.name}
                        onClick={() => setSelectedDpd(dpdNode.name)}
                        className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                              <h5 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {dpdNode.name}
                              </h5>
                            </div>
                            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              +{dpdNode.count}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            Tersebar di {dpdNode.dpcs.length} DPC Kecamatan
                          </p>

                          {/* Recruiter chips */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                            <span className="text-[10px] text-slate-400 block mb-1">Kader Penggerak Utama:</span>
                            <div className="flex flex-wrap gap-1">
                              {dpdNode.recruiters.slice(0, 2).map((r) => (
                                <span
                                  key={r.nama}
                                  className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded"
                                >
                                  {r.nama.split(',')[0]} (+{r.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-mono">
                            {dpdNode.percentage}% dari total rekrutan
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>Buka DPC</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Level 2: When DPD is selected */}
              {selectedDpd && !selectedDpc && activeDpdNode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Tingkat DPD Terpilih
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {activeDpdNode.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Total +{activeDpdNode.count} anggota baru direkrut di wilayah ini.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        +{activeDpdNode.count}
                      </span>
                      <p className="text-[11px] text-slate-500">Anggota Baru</p>
                    </div>
                  </div>

                  {/* Recruiters in this DPD */}
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-2">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kader Perekrut yang Menggerakkan {activeDpdNode.name}:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeDpdNode.recruiters.map((r) => (
                        <button
                          key={r.nama}
                          onClick={() => {
                            setSelectedRecruiter(r.nama);
                            setActiveTab('cadres');
                          }}
                          className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-lg text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{r.nama}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded text-[10px]">
                            +{r.count} orang
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Sebaran DPC (Kecamatan) Asal KTP Anggota Baru
                    </h5>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeDpdNode.dpcs.length} Kecamatan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {activeDpdNode.dpcs.map((dpcNode) => (
                      <div
                        key={dpcNode.name}
                        onClick={() => setSelectedDpc(dpcNode.name)}
                        className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                              <h6 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                Kec. {dpcNode.name}
                              </h6>
                            </div>
                            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              +{dpcNode.count}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            Tersebar di {dpcNode.dprts.length} Kelurahan/Desa (DPRt)
                          </p>

                          <div className="mt-2 text-[10px] text-slate-400">
                            Direkrut oleh: {dpcNode.recruiters.map((r) => r.nama.split(',')[0]).join(', ')}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">
                            {Math.round((dpcNode.count / activeDpdNode.count) * 100)}% dari DPD ini
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>Buka DPRt</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Level 3: When DPC is selected */}
              {selectedDpd && selectedDpc && activeDpcNode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {selectedDpd} · Kecamatan Terpilih
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Kecamatan {activeDpcNode.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        +{activeDpcNode.count} anggota baru di kelurahan/desa berikut.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        +{activeDpcNode.count}
                      </span>
                      <p className="text-[11px] text-slate-500">Anggota Baru</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Daftar DPRt (Kelurahan / Desa) Berbasis Domisili KTP
                    </h5>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeDpcNode.dprts.length} Desa/Kelurahan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {activeDpcNode.dprts.map((dprtNode) => {
                      const isSelected = selectedDprt === dprtNode.name;
                      return (
                        <div
                          key={dprtNode.name}
                          onClick={() => {
                            setSelectedDprt(isSelected ? null : dprtNode.name);
                            setActiveTab('cadres');
                          }}
                          className={`group p-4 rounded-xl shadow-xs transition-all cursor-pointer border flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h6 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Kel/Desa {dprtNode.name}
                              </h6>
                              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                +{dprtNode.count}
                              </span>
                            </div>

                            <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                              Direkrut oleh: {dprtNode.recruiters.map((r) => r.nama.split(',')[0]).join(', ')}
                            </div>

                            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Alamat KTP Faktual</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">
                              {dprtNode.count} Orang Anggota
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              <span>Lihat Anggota</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECRUITERS LEADERBOARD */}
          {activeTab === 'recruiters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Kinerja & Produktivitas Kader Perekrut Lapangan</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kader pengurus dan simpatisan yang aktif membawa dan merekrut anggota baru.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  {recruitersList.length} Kader Penggerak
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {recruitersList.map((recruiter, idx) => (
                  <div
                    key={recruiter.nama}
                    onClick={() => {
                      setSelectedRecruiter(recruiter.nama);
                      setActiveTab('cadres');
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-950 transition-all cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {recruiter.nama}
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {recruiter.jabatan} · {recruiter.dpd}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                          +{recruiter.count} Anggota
                        </span>
                      </div>

                      {/* Top Territories recruited by this cadre */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900">
                        <span className="text-[10px] text-slate-400 block mb-1">Sebaran Alamat KTP Rekrutan:</span>
                        <div className="flex flex-wrap gap-1">
                          {recruiter.territories.slice(0, 3).map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                            >
                              Kec. {t.dpc} ({t.dprt}: +{t.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <span>Lihat {recruiter.count} Nama Anggota Rekrutan</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED CADRE TABLE */}
          {activeTab === 'cadres' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Daftar Anggota Baru & Kader yang Merekrut
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Menampilkan {scopedMembers.length} anggota baru yang terhubung langsung dengan kader perekrutnya.
                  </p>
                </div>
              </div>

              {scopedMembers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Tidak ditemukan anggota dengan filter atau kata kunci ini.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">No.</th>
                          <th className="py-3 px-4">Nama Anggota & NIK</th>
                          <th className="py-3 px-4">Alamat KTP (DPRt / DPC / DPD)</th>
                          <th className="py-3 px-4">Kader yang Merekrut</th>
                          <th className="py-3 px-4">Tgl Rekrutmen</th>
                          <th className="py-3 px-4 text-center">e-KTA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
                        {scopedMembers.map((m, idx) => (
                          <tr
                            key={m.nik}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {m.namaLengkap}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {m.nik} · {m.nomorEKTA || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                Kel/Desa {m.dprt}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Kec. {m.dpc} · {m.dpd}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {m.kaderPerekrutNama || 'Kader Pengurus Wilayah'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {m.kaderPerekrutJabatan || 'Pengurus DPW/DPD'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {m.tanggalBergabung}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {onOpenCardModal && (
                                <button
                                  onClick={() => onOpenCardModal(m)}
                                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                                  title="Pratinjau e-KTA"
                                >
                                  <IdCard className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Menghubungkan kader penggerak dengan anggota baru berdasarkan verifikasi domisili KTP.
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-white px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ml-auto"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
