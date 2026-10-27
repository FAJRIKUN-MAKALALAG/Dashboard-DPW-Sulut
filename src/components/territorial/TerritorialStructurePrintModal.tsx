import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  Building,
  MapPin,
  Home,
  ShieldCheck,
  Award,
  Settings,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { UserSession } from '../../types';
import { GridRowItem } from '../matrix';
import nasdemLogo from '../../assets/logo/logo_nasdem.png';
import anniversaryLogo from '../../assets/logo/Logo_15_Ultah.png';
import * as XLSX from 'xlsx';

interface TerritorialStructurePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  dpd: string;
  dpc?: string;
  dprt?: string;
  gridRows: GridRowItem[];
  session?: UserSession;
}

export const TerritorialStructurePrintModal: React.FC<TerritorialStructurePrintModalProps> = ({
  isOpen,
  onClose,
  level,
  dpd,
  dpc,
  dprt,
  gridRows,
  session,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'filled'>('all');
  const [selectedSubOrg, setSelectedSubOrg] = useState<string>('ALL');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Penentuan Ibu Kota / Nama Kota Penandatanganan Otomatis
  const defaultCity = useMemo(() => {
    if (level === 'DPW') return 'Manado';
    const normDpd = (dpd || '').toUpperCase().trim();
    if (normDpd.includes('MINAHASA SELATAN')) return 'Amurang';
    if (normDpd.includes('MINAHASA UTARA')) return 'Airmadidi';
    if (normDpd.includes('MINAHASA TENGGARA')) return 'Ratahan';
    if (normDpd.includes('MINAHASA') && !normDpd.includes('SELATAN') && !normDpd.includes('UTARA') && !normDpd.includes('TENGGARA')) return 'Tondano';
    if (normDpd.includes('BOLAANG MONGONDOW SELATAN')) return 'Molibagu';
    if (normDpd.includes('BOLAANG MONGONDOW TIMUR')) return 'Tutuyan';
    if (normDpd.includes('BOLAANG MONGONDOW UTARA')) return 'Boroko';
    if (normDpd.includes('BOLAANG MONGONDOW')) return 'Lolak';
    if (normDpd.includes('KOTAMOBAGU')) return 'Kotamobagu';
    if (normDpd.includes('BITUNG')) return 'Bitung';
    if (normDpd.includes('TOMOHON')) return 'Tomohon';
    if (normDpd.includes('SANGIHE')) return 'Tahuna';
    if (normDpd.includes('TALAUD')) return 'Melonguane';
    if (normDpd.includes('SIAU') || normDpd.includes('SITARO')) return 'Ondong';
    if (normDpd.includes('MANADO')) return 'Manado';
    return dpd.replace(/KABUPATEN|KOTA|KEPULAUAN/gi, '').trim() || 'Sulawesi Utara';
  }, [level, dpd]);

  // Nomor SK Otomatis Standar Partai NasDem
  const defaultSkNumber = useMemo(() => {
    const year = new Date().getFullYear();
    if (level === 'DPW') return `SK-001/DPW-NASDEM/SULUT/${year}`;
    if (level === 'DPD') {
      const code = dpd.replace(/KABUPATEN|KOTA|KEPULAUAN|\s+/gi, '').toUpperCase();
      return `SK-DPD-${code}/${year}`;
    }
    if (level === 'DPC') {
      const code = (dpc || 'KEC').replace(/\s+/g, '').toUpperCase();
      return `SK-DPC-${code}/${year}`;
    }
    const code = (dprt || 'DESA').replace(/\s+/g, '').toUpperCase();
    return `SK-DPRT-${code}/${year}`;
  }, [level, dpd, dpc, dprt]);

  // Deteksi Nama Ketua Definitif dari baris data matriks
  const detectedKetua = useMemo(() => {
    if (level === 'DPW') {
      return {
        nama: 'Dr. J. Victor Mailangkay, SH, MH',
        kta: 'ND-7100-2024-0001',
      };
    }
    const row = gridRows.find((r) => {
      const j = r.jabatan.trim().toLowerCase();
      const sub = (r.subOrg || '').toLowerCase();
      const isKetuaJabatan = j === 'ketua' || j.startsWith('ketua dpd') || j.startsWith('ketua dpc') || j.startsWith('ketua dprt');
      const isBukanWakil = !j.includes('wakil') && !j.includes('bidang');
      return isKetuaJabatan && isBukanWakil && !sub.includes('pakar') && !sub.includes('pertimbangan') && r.namaLengkap.trim() !== '';
    });
    if (row && row.namaLengkap.trim()) {
      return {
        nama: row.namaLengkap.trim(),
        kta: row.nomorEKTA || (row.nik && !row.nik.startsWith('71002026') ? row.nik : 'TERDAFTAR PUSAT'),
      };
    }
    return {
      nama: `KETUA ${level} DEFINITIF`,
      kta: 'TERDAFTAR PUSAT',
    };
  }, [gridRows, level]);

  // Deteksi Nama Sekretaris Definitif dari baris data matriks
  const detectedSekretaris = useMemo(() => {
    if (level === 'DPW') {
      return {
        nama: 'Dr. Ir. GS Vicky Lumentut, SH, M.Si',
        kta: 'ND-7100-2024-0002',
      };
    }
    const row = gridRows.find((r) => {
      const j = r.jabatan.trim().toLowerCase();
      const isSekretarisJabatan = j === 'sekretaris' || j.startsWith('sekretaris dpd') || j.startsWith('sekretaris dpc') || j.startsWith('sekretaris dprt');
      const isBukanWakil = !j.includes('wakil');
      return isSekretarisJabatan && isBukanWakil && r.namaLengkap.trim() !== '';
    });
    if (row && row.namaLengkap.trim()) {
      return {
        nama: row.namaLengkap.trim(),
        kta: row.nomorEKTA || (row.nik && !row.nik.startsWith('71002026') ? row.nik : 'TERDAFTAR PUSAT'),
      };
    }
    return {
      nama: `SEKRETARIS ${level} DEFINITIF`,
      kta: 'TERDAFTAR PUSAT',
    };
  }, [gridRows, level]);

  // State kustomisasi SK dan penandatangan yang bisa diedit langsung sebelum cetak
  const [skNumber, setSkNumber] = useState<string>(defaultSkNumber);
  const [signCity, setSignCity] = useState<string>(defaultCity);
  const [ketuaName, setKetuaName] = useState<string>(detectedKetua.nama);
  const [ketuaKta, setKetuaKta] = useState<string>(detectedKetua.kta);
  const [sekretarisName, setSekretarisName] = useState<string>(detectedSekretaris.nama);
  const [sekretarisKta, setSekretarisKta] = useState<string>(detectedSekretaris.kta);

  // Sync saat data atau level berubah
  useEffect(() => {
    setSkNumber(defaultSkNumber);
    setSignCity(defaultCity);
    setKetuaName(detectedKetua.nama);
    setKetuaKta(detectedKetua.kta);
    setSekretarisName(detectedSekretaris.nama);
    setSekretarisKta(detectedSekretaris.kta);
  }, [defaultSkNumber, defaultCity, detectedKetua, detectedSekretaris]);

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Judul Wilayah Teritorial
  const territoryTitle =
    level === 'DPW'
      ? 'PROVINSI SULAWESI UTARA'
      : level === 'DPD'
      ? `${dpd.toUpperCase()}`
      : level === 'DPC'
      ? `KECAMATAN ${dpc?.toUpperCase() || '-'} - ${dpd.toUpperCase()}`
      : `DESA/KELURAHAN ${dprt?.toUpperCase() || '-'} - KEC. ${dpc?.toUpperCase() || '-'} (${dpd.toUpperCase()})`;

  const levelText =
    level === 'DPW'
      ? 'DEWAN PIMPINAN WILAYAH (DPW)'
      : level === 'DPD'
      ? 'DEWAN PIMPINAN DAERAH (DPD)'
      : level === 'DPC'
      ? 'DEWAN PIMPINAN CABANG (DPC)'
      : 'DEWAN PIMPINAN RANTING (DPRt)';

  // Daftar Sub Organisasi Unik
  const availableSubOrgs = useMemo(() => {
    const set = new Set<string>();
    gridRows.forEach((r) => {
      if (r.subOrg && r.subOrg.trim()) set.add(r.subOrg.trim());
    });
    return Array.from(set);
  }, [gridRows]);

  // Metrik Keterisian
  const totalSlots = gridRows.length;
  const filledRows = gridRows.filter((r) => r.namaLengkap.trim() !== '');
  const emptyCount = totalSlots - filledRows.length;
  const percentage = totalSlots > 0 ? Math.round((filledRows.length / totalSlots) * 100) : 0;

  // Filter baris yang akan dicetak
  const rowsToPrint = useMemo(() => {
    let result = gridRows;
    if (filterMode === 'filled') {
      result = result.filter((r) => r.namaLengkap.trim() !== '');
    }
    if (selectedSubOrg !== 'ALL') {
      result = result.filter((r) => (r.subOrg || '').trim() === selectedSubOrg.trim());
    }
    return result;
  }, [gridRows, filterMode, selectedSubOrg]);

  // Kelompokkan baris berdasarkan Sub Organisasi
  const groupedRows = useMemo(() => {
    const map = new Map<string, GridRowItem[]>();
    rowsToPrint.forEach((r) => {
      const sub = r.subOrg || `DEWAN PIMPINAN ${level}`;
      if (!map.has(sub)) map.set(sub, []);
      map.get(sub)!.push(r);
    });

    const sortPriority = (title: string) => {
      const t = title.toUpperCase();
      if (t.includes('PERTIMBANGAN')) return 1;
      if (t.includes('PAKAR')) return 2;
      if (t.includes('PIMPINAN') || t.includes('DPD') || t.includes('DPW') || t.includes('CABANG') || t.includes('RANTING'))
        return 3;
      return 4;
    };

    return Array.from(map.entries()).sort(([a], [b]) => sortPriority(a) - sortPriority(b));
  }, [rowsToPrint, level]);

  const handlePrint = () => {
    window.print();
  };

  const handleResetSettings = () => {
    setSkNumber(defaultSkNumber);
    setSignCity(defaultCity);
    setKetuaName(detectedKetua.nama);
    setKetuaKta(detectedKetua.kta);
    setSekretarisName(detectedSekretaris.nama);
    setSekretarisKta(detectedSekretaris.kta);
  };

  const handleExportExcel = () => {
    const exportData = rowsToPrint.map((r, i) => ({
      No: i + 1,
      'Sub Organisasi': r.subOrg,
      'Jabatan Pengurus': r.jabatan,
      'Nama Lengkap & Gelar': r.namaLengkap || '(Belum Terisi)',
      'Nomor NIK': r.nik || '-',
      'Nomor E-KTA': r.nomorEKTA || '-',
      'No. WhatsApp / HP': r.nomorHP || '-',
      Email: r.email || '-',
      Status: r.namaLengkap.trim() !== '' ? 'Aktif Terverifikasi' : 'Lowong',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Susunan Pengurus');
    XLSX.writeFile(
      wb,
      `SUSUNAN_PENGURUS_${level}_${dpd.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:overflow-visible print:static print:inset-auto print:h-auto print:w-full`}
    >
      <div
        className={`relative w-full ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-5xl'
        } bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:overflow-visible print:w-full print:static`}
      >
        {/* Controls Bar (Disembunyikan saat mencetak) */}
        <div className="no-print bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-20 shrink-0 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <Printer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Cetak Dokumen Susunan Pengurus</span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {level}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({dpd})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format Surat Keputusan (SK) &amp; Lampiran Resmi &bull; Ekspor PDF A4 / Cetak Fisik
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Mode */}
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                    filterMode === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Semua ({totalSlots})
                </button>
                <button
                  onClick={() => setFilterMode('filled')}
                  className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                    filterMode === 'filled'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Terisi ({filledRows.length})
                </button>
              </div>

              {/* Sub-Organisasi Dropdown */}
              {availableSubOrgs.length > 1 && (
                <select
                  value={selectedSubOrg}
                  onChange={(e) => setSelectedSubOrg(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer font-medium"
                >
                  <option value="ALL">Semua Sub-Organisasi</option>
                  {availableSubOrgs.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}

              {/* Orientation Toggle */}
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                    orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Format Kertas Tegak (A4 Portrait)"
                >
                  Tegak (A4)
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                    orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Format Kertas Mendatar (A4 Landscape)"
                >
                  Mendatar (A4)
                </button>
              </div>

              {/* Toggle Settings Drawer */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  showSettings ? 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/40' : ''
                }`}
                title="Sesuaikan Nomor SK, Kota, dan Nama Penandatangan"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan SK</span>
                {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={handleExportExcel}
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                title="Unduh Format Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors"
                title="Cetak langsung atau simpan sebagai dokumen PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>

              <button
                onClick={onClose}
                className="btn-white p-1.5 rounded-lg cursor-pointer ml-1"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Settings Drawer */}
          {showSettings && (
            <div className="p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Kustomisasi Parameter Surat Keputusan &amp; Penandatangan
                </span>
                <button
                  onClick={handleResetSettings}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
                  title="Kembalikan nilai awal otomatis dari sistem"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Otomatis</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nomor Lampiran SK:
                  </label>
                  <input
                    type="text"
                    value={skNumber}
                    onChange={(e) => setSkNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                    placeholder="Contoh: SK-001/DPW-NASDEM/SULUT/2026"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kota Penandatanganan:
                  </label>
                  <input
                    type="text"
                    value={signCity}
                    onChange={(e) => setSignCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                    placeholder="Contoh: Manado / Amurang / Kotamobagu"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Status Deteksi:
                  </label>
                  <div className="px-2.5 py-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    &bull; Ketua &amp; Sekretaris otomatis disinkron dari matriks
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nama Ketua Penandatangan:
                  </label>
                  <input
                    type="text"
                    value={ketuaName}
                    onChange={(e) => setKetuaName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    No. e-KTA / NIK Ketua:
                  </label>
                  <input
                    type="text"
                    value={ketuaKta}
                    onChange={(e) => setKetuaKta(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nama Sekretaris Penandatangan:
                  </label>
                  <input
                    type="text"
                    value={sekretarisName}
                    onChange={(e) => setSekretarisName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Printable Official Document Body */}
        <div
          className={`p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0 print:overflow-visible ${
            orientation === 'landscape' ? 'print:landscape' : 'print:portrait'
          }`}
        >
          {/* Official Letterhead (KOP SURAT RESMI PARTAI NASDEM) */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-5 flex items-center justify-between gap-4">
            {/* Logo Utama Partai NasDem */}
            <div className="w-24 h-24 flex items-center justify-center shrink-0">
              <img
                src={nasdemLogo}
                alt="Logo Resmi Partai NasDem"
                className="max-h-24 max-w-full object-contain"
              />
            </div>

            {/* Identitas Organisasi Kop Surat */}
            <div className="text-center flex-1 px-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase text-slate-950 leading-tight">
                PARTAI NASDEM (NASIONAL DEMOKRAT)
              </h1>
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-blue-950 mt-0.5">
                {levelText}
              </h2>
              <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-800">
                {territoryTitle}
              </h3>
              <p className="text-[11px] text-slate-600 mt-1">
                Sekretariat: Jl. Lengkong Wuaya, Paal Dua / Jl. 17 Agustus, Manado, Sulawesi Utara &bull; Telp: (0431) 845201
              </p>
              <p className="text-[10px] text-slate-500 italic mt-0.5 font-medium">
                Gerakan Perubahan &bull; Restorasi Indonesia &bull; Sistem Manajemen Keanggotaan &amp; Struktur Teritorial
              </p>
            </div>

            {/* Logo Ulang Tahun / Badge Validasi Dokumen */}
            <div className="w-24 h-24 flex flex-col items-center justify-center shrink-0 text-center">
              <img
                src={anniversaryLogo}
                alt="Logo 15 Tahun NasDem"
                className="max-h-16 max-w-full object-contain drop-shadow-xs"
              />
              <span className="text-[9px] font-mono font-bold text-slate-700 mt-1 block">
                DOKUMEN RESMI
              </span>
              <span className="text-[8px] font-mono text-emerald-700 font-extrabold block">
                TERVALIDASI DPW
              </span>
            </div>
          </div>

          {/* Garis Aksen Emas & Biru */}
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900 mb-5"></div>

          {/* Document Title Header */}
          <div className="text-center mb-5">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
              LAMPIRAN SURAT KEPUTUSAN KEPENGURUSAN
            </h3>
            <p className="text-xs font-mono font-bold text-blue-950 mt-0.5">
              NOMOR: {skNumber}
            </p>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-900 mt-1">
              SUSUNAN PENGURUS {levelText}
            </h4>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {territoryTitle} &bull; PERIODE KEPENGURUSAN 2024 - 2029
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Status Data: Terverifikasi Sistem Tanggal <strong>{currentDateFormatted}</strong>
            </p>
          </div>

          {/* Executive KPI Summary Boxes */}
          <div className="mb-6 p-3.5 border border-slate-300 rounded-xl bg-slate-50/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-300 print:mb-4 print:p-2.5">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                Total Posisi Struktur
              </span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {totalSlots}
              </span>
              <span className="text-[10px] text-slate-500 block">Posisi Resmi</span>
            </div>

            <div className="pt-2 sm:pt-0">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                Posisi Terisi (Definitif)
              </span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                {filledRows.length}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {percentage}% Kelengkapan
              </span>
            </div>

            <div className="pt-2 sm:pt-0">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                Posisi Lowong / Kosong
              </span>
              <span className="text-xl font-black text-amber-700 font-mono">
                {emptyCount}
              </span>
              <span className="text-[10px] text-slate-500 block">Menunggu Penetapan</span>
            </div>

            <div className="pt-2 sm:pt-0">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                Status Kesiapan SK
              </span>
              <span className="text-base font-extrabold mt-0.5 block text-slate-900">
                {percentage >= 90 ? (
                  <span className="text-emerald-700">LENGKAP &amp; SOLID</span>
                ) : percentage >= 50 ? (
                  <span className="text-blue-700">STRUKTUR SEBAGIAN</span>
                ) : (
                  <span className="text-amber-700">PERLU KONSOLIDASI</span>
                )}
              </span>
              <span className="text-[10px] text-slate-500 block">Verifikasi OKK</span>
            </div>
          </div>

          {/* Tabel Susunan Pengurus */}
          <div className="mb-6 space-y-5 print:space-y-4">
            {groupedRows.map(([subOrgName, rows], groupIdx) => (
              <div key={groupIdx} className="border border-slate-300 rounded-lg overflow-hidden print:break-inside-avoid">
                {/* Sub Organisasi Header Banner */}
                <div className="bg-slate-800 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between print:bg-slate-900">
                  <span>{subOrgName}</span>
                  <span className="text-[10px] font-mono text-slate-300 font-normal">
                    {rows.filter((r) => r.namaLengkap.trim() !== '').length} / {rows.length} Terisi
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold text-[11px] border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                      <th className="p-2 border-r border-slate-300 w-1/3">Jabatan Pengurus</th>
                      <th className="p-2 border-r border-slate-300 w-1/3">Nama Lengkap &amp; Gelar</th>
                      <th className="p-2 border-r border-slate-300">Nomor KTA / NIK</th>
                      <th className="p-2 border-r border-slate-300">No. WhatsApp / HP</th>
                      <th className="p-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {rows.map((row, rIdx) => {
                      const isFilled = row.namaLengkap.trim() !== '';
                      return (
                        <tr
                          key={row.id || rIdx}
                          className={
                            !isFilled
                              ? 'bg-amber-50/50 print:bg-white'
                              : rIdx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/60 print:bg-white'
                          }
                        >
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500">
                            {rIdx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">
                            {row.jabatan}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            {isFilled ? (
                              <span className="font-bold text-slate-950">{row.namaLengkap}</span>
                            ) : (
                              <span className="italic text-slate-400 font-normal">
                                (Lowong / Belum Ditetapkan)
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-600">
                            {row.nomorEKTA || (row.nik && !row.nik.startsWith('71002026') ? row.nik : '-')}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 text-[11px]">
                            {row.nomorHP && row.nomorHP !== '-' ? row.nomorHP : '-'}
                          </td>
                          <td className="p-2 text-center">
                            {isFilled ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 print:border-none">
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 print:border-none">
                                Lowong
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Official Signatures & Stempel Block */}
          <div className="print-break-inside-avoid mt-8 pt-4 border-t-2 border-slate-300">
            <div className="flex justify-between items-start text-xs text-slate-800">
              
              {/* Kolom Kiri: Sekretaris */}
              <div className="text-left w-64 space-y-16">
                <div>
                  <p className="text-slate-600">Ditetapkan &amp; Diverifikasi Oleh:</p>
                  <p className="font-bold text-slate-950 uppercase">
                    SEKRETARIS {levelText}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">PARTAI NASDEM {territoryTitle}</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm text-slate-950">
                    {sekretarisName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    No. e-KTA: {sekretarisKta}
                  </p>
                </div>
              </div>

              {/* Kolom Tengah: Stempel Basah Resmi */}
              <div className="text-center w-52 flex flex-col items-center justify-center">
                <div
                  className="w-28 h-28 border-2 border-blue-800 rounded-full flex flex-col items-center justify-center text-blue-900 font-serif p-1.5 shadow-2xs rotate-[-3deg] relative"
                  style={{
                    boxShadow: 'inset 0 0 0 2px #1e40af',
                  }}
                >
                  <div className="text-[8px] font-bold tracking-widest uppercase">PARTAI NASDEM</div>
                  <div className="my-0.5 text-xs text-amber-500">&#9733; &#9733; &#9733;</div>
                  <div className="font-black text-[9px] text-center leading-tight uppercase px-1 text-blue-950">
                    DEWAN PIMPINAN {level}
                  </div>
                  <div className="text-[8px] font-bold text-slate-700 tracking-wider uppercase mt-0.5">
                    {dpd || 'SULAWESI UTARA'}
                  </div>
                  <div className="text-[6.5px] text-slate-500 tracking-widest mt-0.5 font-mono">
                    SEKRETARIAT RESMI
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1.5">
                  CAP / STEMPEL RESMI
                </span>
              </div>

              {/* Kolom Kanan: Ketua */}
              <div className="text-right w-64 space-y-16">
                <div>
                  <p className="text-slate-600">{signCity}, {currentDateFormatted}</p>
                  <p className="font-bold text-slate-950 uppercase">
                    KETUA {levelText}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">PARTAI NASDEM {territoryTitle}</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm text-slate-950">
                    {ketuaName}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    No. e-KTA: {ketuaKta}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Dokumen Resmi */}
            <div className="mt-8 pt-2.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Sistem Manajemen Keanggotaan &amp; Teritorial DPW Partai NasDem Sulut</span>
              <span>Dokumen Resmi Terverifikasi Digital &bull; {skNumber}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TerritorialStructurePrintModal;
