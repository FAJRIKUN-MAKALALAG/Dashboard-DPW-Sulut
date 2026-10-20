import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  Building2,
  Building,
  MapPin,
  Home,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserSession } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import {
  TerritoryContext,
  downloadTerritorialExcelTemplate,
  downloadAdvisoryOnlyExcelTemplate,
  downloadExpertOnlyExcelTemplate,
  downloadAdvisoryAndExpertExcelTemplate,
} from '../../utils/territorialExcelTemplateUtils';
import { isDpdMatch, isDpcMatch } from '../../utils/structureReadinessUtils';

interface TemplateDownloadHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: UserSession;
  onOpenTerritorialMatrix?: (dpd?: string, dpc?: string, level?: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  onOpenImportForTerritory?: (ctx: TerritoryContext) => void;
}

export const TemplateDownloadHubModal: React.FC<TemplateDownloadHubModalProps> = ({
  isOpen,
  onClose,
  session,
  onOpenTerritorialMatrix,
  onOpenImportForTerritory,
}) => {
  const [activeLevel, setActiveLevel] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt'>('DPD');

  // Wilayah terpilih
  const [selectedDpd, setSelectedDpd] = useState<string>(() => {
    if (session?.dpdAccess && session.dpdAccess !== 'ALL') return session.dpdAccess;
    return SULUT_REGIONS[0]?.name || 'Kabupaten Minahasa Selatan';
  });

  const currentRegion = SULUT_REGIONS.find((r) => isDpdMatch(r.name, selectedDpd)) || SULUT_REGIONS[0];
  const subdistricts = currentRegion?.subdistricts || [];

  const [selectedDpc, setSelectedDpc] = useState<string>(() => {
    if (session?.dpcAccess && session.dpcAccess !== 'ALL') return session.dpcAccess;
    return subdistricts[0]?.name || 'TUMPAAN';
  });

  const currentSubdistrict = subdistricts.find((s) => isDpcMatch(s.name, selectedDpc)) || subdistricts[0];
  const villages = currentSubdistrict?.villages || [];

  const [selectedDprt, setSelectedDprt] = useState<string>(() => {
    if (session?.dprtAccess && session.dprtAccess !== 'ALL') return session.dprtAccess;
    return villages[0] || 'Pusat';
  });

  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentContext: TerritoryContext = {
    level: activeLevel,
    dpd: activeLevel === 'DPW' ? 'Sulawesi Utara' : selectedDpd,
    dpc: activeLevel === 'DPC' || activeLevel === 'DPRt' ? selectedDpc : (activeLevel === 'DPW' ? 'Wilayah DPW' : 'Umum (DPD)'),
    dprt: activeLevel === 'DPRt' ? selectedDprt : 'Pusat/Umum',
  };

  const triggerDownload = (downloadFn: () => void, label: string) => {
    downloadFn();
    setDownloadSuccessMsg(`Berkas "${label}" berhasil diunduh ke perangkat Anda!`);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleNavigateToMatrix = () => {
    onClose();
    if (onOpenTerritorialMatrix) {
      onOpenTerritorialMatrix(selectedDpd, selectedDpc, activeLevel);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Pusat Unduh Template Excel Resmi Partai NasDem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Format baku database siap pakai untuk input massal susunan pengurus & kader.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Alert Download Success */}
          {downloadSuccessMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{downloadSuccessMsg}</span>
            </div>
          )}

          {/* Level Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Langkah 1: Pilih Tingkatan Kepengurusan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveLevel('DPW')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeLevel === 'DPW'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>DPW Provinsi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLevel('DPD')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeLevel === 'DPD'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>DPD Kab/Kota</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLevel('DPC')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeLevel === 'DPC'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>DPC Kecamatan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLevel('DPRt')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeLevel === 'DPRt'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>DPRt Ranting</span>
              </button>
            </div>
          </div>

          {/* Territory Selectors (if not DPW) */}
          {activeLevel !== 'DPW' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  📍
                </span>
                <span>Langkah 2: Tentukan Spesifikasi Wilayah Sasaran</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* DPD Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Kabupaten / Kota (DPD):
                  </label>
                  <select
                    value={selectedDpd}
                    onChange={(e) => {
                      setSelectedDpd(e.target.value);
                      const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, e.target.value));
                      if (reg?.subdistricts[0]) {
                        setSelectedDpc(reg.subdistricts[0].name);
                        if (reg.subdistricts[0].villages[0]) {
                          setSelectedDprt(reg.subdistricts[0].villages[0]);
                        }
                      }
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    {SULUT_REGIONS.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DPC Selector (For DPC & DPRt) */}
                {(activeLevel === 'DPC' || activeLevel === 'DPRt') && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Kecamatan (DPC):
                    </label>
                    <select
                      value={selectedDpc}
                      onChange={(e) => {
                        setSelectedDpc(e.target.value);
                        const sub = subdistricts.find((s) => isDpcMatch(s.name, e.target.value));
                        if (sub?.villages[0]) {
                          setSelectedDprt(sub.villages[0]);
                        }
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    >
                      {subdistricts.map((s) => (
                        <option key={s.name} value={s.name}>
                          Kec. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* DPRt Selector (For DPRt) */}
                {activeLevel === 'DPRt' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Desa / Kelurahan (DPRt):
                    </label>
                    <select
                      value={selectedDprt}
                      onChange={(e) => setSelectedDprt(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                    >
                      {villages.map((v, i) => (
                        <option key={i} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download Cards Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Langkah {activeLevel === 'DPW' ? '2' : '3'}: Unduh Format Template Excel (.xlsx)
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Template Lengkap Resmi */}
              <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Template Lengkap (Seluruh Posisi)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Berisi seluruh daftar jabatan resmi untuk <strong>{activeLevel}</strong> (Ketua, Wakil-Wakil Ketua Bidang, Sekretaris, Bendahara, hingga anggota) yang sudah disusun rapi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    triggerDownload(
                      () => downloadTerritorialExcelTemplate(currentContext),
                      `Template Lengkap ${activeLevel}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Template Lengkap (.xlsx)</span>
                </button>
              </div>

              {/* Option 2: Dewan Pertimbangan (Khusus DPW & DPD) */}
              {(activeLevel === 'DPW' || activeLevel === 'DPD') ? (
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                      <span className="text-base">🏛️</span>
                      <span>Khusus Dewan Pertimbangan</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      Format khusus terisolasi nomor 1..N murni untuk <strong>Dewan Pertimbangan {activeLevel}</strong> (Ketua, Wakil, Sekretaris, Anggota).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(
                        () => downloadAdvisoryOnlyExcelTemplate(currentContext),
                        `Template Dewan Pertimbangan ${activeLevel}`
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Dewan Pertimbangan (.xlsx)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Alur Cepat Input Massal</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      Cukup unduh template, isi nama kader pada kolom <strong>Nama Lengkap</strong>, lalu gunakan tombol Import untuk memasukkan langsung ke matriks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNavigateToMatrix}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Buka Layar Matriks {activeLevel}</span>
                  </button>
                </div>
              )}

              {/* Option 3: Dewan Pakar (Khusus DPW & DPD) */}
              {(activeLevel === 'DPW' || activeLevel === 'DPD') && (
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                      <span className="text-base">🎓</span>
                      <span>Khusus Dewan Pakar</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      Format khusus terisolasi nomor 1..N murni untuk <strong>Dewan Pakar {activeLevel}</strong> agar salin tempel data tidak tertukar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(
                        () => downloadExpertOnlyExcelTemplate(currentContext),
                        `Template Dewan Pakar ${activeLevel}`
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Dewan Pakar (.xlsx)</span>
                  </button>
                </div>
              )}

              {/* Option 4: 2 Sheet Terpisah */}
              {(activeLevel === 'DPW' || activeLevel === 'DPD') && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                      <span className="text-base">📑</span>
                      <span>Format 2 Sheet (Pertimbangan & Pakar)</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      Satu file berisi 2 lembar kerja terpisah (Sheet 1: Dewan Pertimbangan | Sheet 2: Dewan Pakar).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(
                        () => downloadAdvisoryAndExpertExcelTemplate(currentContext),
                        `Template 2 Sheet ${activeLevel}`
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh 2 Sheet Terpisah (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Flow Guide */}
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-950 dark:text-blue-200 space-y-1">
                <p className="font-bold">Panduan Pengisian & Import Massal:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-blue-900 dark:text-blue-300 text-[11px]">
                  <li>Unduh template Excel sesuai tingkatan di atas.</li>
                  <li>Buka file di Microsoft Excel, cukup isi kolom <strong>Nama Lengkap</strong> dan <strong>NIK</strong>. Baris posisi resmi sudah disiapkan otomatis.</li>
                  <li>Jika NIK dikosongkan, sistem akan meng-generate nomor registrasi otomatis sehingga tidak ada data yang hilang.</li>
                  <li>Setelah selesai diisi, buka halaman matriks terkait dan klik tombol <strong>Import Excel</strong> untuk menyimpan ke database.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg btn-white cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleNavigateToMatrix}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <span>Buka Layar Matriks {activeLevel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateDownloadHubModal;
