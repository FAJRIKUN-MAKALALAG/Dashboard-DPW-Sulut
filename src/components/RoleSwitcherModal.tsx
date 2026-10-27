import React, { useState } from 'react';
import { UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  X,
  Shield,
  Building2,
  Building,
  MapPin,
  Home,
  CheckCircle2,
  UserCheck,
  Crown,
  Search,
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onSelectSession: (session: UserSession) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSelectSession,
}) => {
  const [activeTab, setActiveTab] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRT'>('DPW');

  // State for DPD role selection
  const [selectedDpdOnly, setSelectedDpdOnly] = useState<string>(
    SULUT_REGIONS[0]?.name || 'Kota Manado'
  );

  // State for DPC role selection
  const [selectedDpdForDpc, setSelectedDpdForDpc] = useState<string>(
    SULUT_REGIONS[0]?.name || 'Kota Manado'
  );
  const [selectedDpc, setSelectedDpc] = useState<string>(
    SULUT_REGIONS[0]?.subdistricts[0]?.name || 'Wenang'
  );

  // State for DPRt role selection
  const [selectedDpdForDprt, setSelectedDpdForDprt] = useState<string>(
    SULUT_REGIONS[0]?.name || 'Kota Manado'
  );
  const [selectedDpcForDprt, setSelectedDpcForDprt] = useState<string>(
    SULUT_REGIONS[0]?.subdistricts[0]?.name || 'Wenang'
  );
  const [selectedDprt, setSelectedDprt] = useState<string>(
    SULUT_REGIONS[0]?.subdistricts[0]?.villages[0] || 'Tikala Kumaraka'
  );

  if (!isOpen) return null;

  const currentDpdObjForDpc = SULUT_REGIONS.find((r) => r.name === selectedDpdForDpc);
  const currentDpdObjForDprt = SULUT_REGIONS.find((r) => r.name === selectedDpdForDprt);
  const currentDpcObjForDprt = currentDpdObjForDprt?.subdistricts.find(
    (s) => s.name === selectedDpcForDprt
  );

  // 1. DPW Level Handlers
  const handleSelectSuperAdmin = () => {
    onSelectSession({
      role: 'SUPER_ADMIN',
      dpdAccess: 'ALL',
      dpcAccess: 'ALL',
      dprtAccess: 'ALL',
      adminName: 'Bappilu & OKK DPW NasDem Sulut',
      jabatan: 'Super Admin DPW Partai NasDem Sulut',
    });
    onClose();
  };

  const handleSelectKetuaDpw = () => {
    onSelectSession({
      role: 'ADMIN_DPW',
      dpdAccess: 'ALL',
      dpcAccess: 'ALL',
      dprtAccess: 'ALL',
      adminName: 'Ketua DPW NasDem Sulut',
      jabatan: 'Ketua DPW Partai NasDem Sulawesi Utara',
    });
    onClose();
  };

  const handleSelectPengurusDpw = () => {
    onSelectSession({
      role: 'ADMIN_DPW',
      dpdAccess: 'ALL',
      dpcAccess: 'ALL',
      dprtAccess: 'ALL',
      adminName: 'Pengurus DPW NasDem Sulut',
      jabatan: 'Wakil Ketua Bidang OKK DPW NasDem Sulut',
    });
    onClose();
  };

  // 2. DPD Level Handlers
  const handleSelectKetuaDpd = (dpdName: string) => {
    const cleanName = dpdName.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPD',
      dpdAccess: dpdName,
      adminName: `Ketua DPD NasDem ${cleanName}`,
      jabatan: `Ketua DPD Partai NasDem ${dpdName}`,
    });
    onClose();
  };

  const handleSelectPengurusDpd = (dpdName: string) => {
    const cleanName = dpdName.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPD',
      dpdAccess: dpdName,
      adminName: `Pengurus DPD NasDem ${cleanName}`,
      jabatan: `Sekretaris DPD Partai NasDem ${dpdName}`,
    });
    onClose();
  };

  // 3. DPC Level Handlers
  const handleSelectKetuaDpc = () => {
    const cleanDpd = selectedDpdForDpc.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPC',
      dpdAccess: selectedDpdForDpc,
      dpcAccess: selectedDpc,
      adminName: `Ketua DPC Kec. ${selectedDpc}`,
      jabatan: `Ketua DPC Partai NasDem Kec. ${selectedDpc} (${cleanDpd})`,
    });
    onClose();
  };

  const handleSelectPengurusDpc = () => {
    const cleanDpd = selectedDpdForDpc.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPC',
      dpdAccess: selectedDpdForDpc,
      dpcAccess: selectedDpc,
      adminName: `Pengurus DPC Kec. ${selectedDpc}`,
      jabatan: `Sekretaris DPC Partai NasDem Kec. ${selectedDpc} (${cleanDpd})`,
    });
    onClose();
  };

  // 4. DPRt Level Handlers
  const handleSelectKetuaDprt = () => {
    onSelectSession({
      role: 'ADMIN_DPRT',
      dpdAccess: selectedDpdForDprt,
      dpcAccess: selectedDpcForDprt,
      dprtAccess: selectedDprt,
      adminName: `Ketua DPRt ${selectedDprt}`,
      jabatan: `Ketua DPRt Partai NasDem ${selectedDprt} (Kec. ${selectedDpcForDprt})`,
    });
    onClose();
  };

  const handleSelectPengurusDprt = () => {
    onSelectSession({
      role: 'ADMIN_DPRT',
      dpdAccess: selectedDpdForDprt,
      dpcAccess: selectedDpcForDprt,
      dprtAccess: selectedDprt,
      adminName: `Pengurus DPRt ${selectedDprt}`,
      jabatan: `Pengurus DPRt Partai NasDem ${selectedDprt} (Kec. ${selectedDpcForDprt})`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl sm:max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Header (Clean basic style) */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Simulasi Peran &amp; Hak Akses
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uji hak akses: Super Admin, Ketua Wilayah, dan Pengurus (DPW s/d DPRt)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation (Clean muted style) */}
          <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('DPW')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'DPW'
                  ? 'border-blue-700 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>1. DPW Sulut</span>
            </button>

            <button
              onClick={() => setActiveTab('DPD')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'DPD'
                  ? 'border-blue-700 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>2. DPD Kab/Kota</span>
            </button>

            <button
              onClick={() => setActiveTab('DPC')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'DPC'
                  ? 'border-blue-700 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>3. DPC Kecamatan</span>
            </button>

            <button
              onClick={() => setActiveTab('DPRT')}
              className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'DPRT'
                  ? 'border-blue-700 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>4. DPRt Ranting</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {/* TAB 1: DPW */}
            {activeTab === 'DPW' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400">
                  Tingkat Provinsi Sulawesi Utara memiliki 3 tipe peran dengan batasan otoritas yang tegas.
                </div>

                {/* 1. Super Admin DPW */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Administrator Sistem
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          TANPA REFERRAL
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        Super Admin DPW (Administrator Teknis)
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        • Akses Dashboard Eksekutif Se-Sulut<br />
                        • <strong>Satu-satunya yang dapat membuatkan akun admin</strong> (Manajemen Akun)<br />
                        • <strong>Tidak memiliki kode referral</strong> (karena merupakan akun administrator teknis)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSelectSuperAdmin}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktifkan Peran Super Admin DPW</span>
                  </button>
                </div>

                {/* 2. Ketua DPW */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Otoritas Tertinggi Partai
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                        PUNYA REFERRAL
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Ketua DPW Partai NasDem Sulut</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • Memiliki hak tertinggi dari sistem ini untuk <strong>melihat seluruh data se-Sulawesi Utara</strong><br />
                      • Akses Dashboard Utama &amp; Struktur Lengkap (DPD, DPC, DPRt)<br />
                      • Memiliki Kode Referral untuk rekrutmen kader<br />
                      • <strong>TIDAK BISA membuatkan akun admin</strong> (wewenang eksklusif Super Admin)
                    </p>
                  </div>
                  <button
                    onClick={handleSelectKetuaDpw}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktifkan Peran Ketua DPW Sulut</span>
                  </button>
                </div>

                {/* 3. Pengurus DPW */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pengurus Struktural
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        DASHBOARD DIHAPUS
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Pengurus DPW Partai NasDem Sulut</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • <strong>Dashboard utama dihapus</strong> (landing page langsung ke Portal Pengurus)<br />
                      • Mengakses Profile Settings &amp; ID Card Mandiri<br />
                      • Mengakses Kode Referral &amp; Formulir Pengisian Rekrutmen Anggota Baru<br />
                      • <strong>Fitur Pencarian:</strong> Dapat mencari semua keanggotaan &amp; kepengurusan dari tingkatan DPD, DPC, dan DPRt
                    </p>
                  </div>
                  <button
                    onClick={handleSelectPengurusDpw}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Aktifkan Peran Pengurus DPW (Portal &amp; Pencarian Se-Sulut)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: DPD */}
            {activeTab === 'DPD' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                    Pilih DPD Kabupaten / Kota:
                  </label>
                  <select
                    value={selectedDpdOnly}
                    onChange={(e) => setSelectedDpdOnly(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  >
                    {SULUT_REGIONS.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilihan A: Ketua DPD */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                      Pimpinan Wilayah Kabupaten/Kota
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Ketua DPD {selectedDpdOnly}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • Mengakses <strong>Dashboard khusus wilayahnya saja</strong> ({selectedDpdOnly})<br />
                      • Dapat melihat semua data wilayahnya mulai dari semua DPC dan DPRt di bawahnya<br />
                      • Memiliki Kode Referral untuk rekrutmen anggota
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectKetuaDpd(selectedDpdOnly)}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Masuk sebagai Ketua DPD {selectedDpdOnly} (Ada Dashboard)</span>
                  </button>
                </div>

                {/* Pilihan B: Pengurus DPD */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Pengurus Struktural DPD
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Pengurus DPD {selectedDpdOnly}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • <strong>Dashboard dihapus</strong> (langsung ke Portal Pengurus)<br />
                      • Mengakses Profile Settings, Kode Referral, dan Halaman Formulir<br />
                      • <strong>Fitur Pencarian:</strong> Hanya bisa mengakses semua data di wilayahnya saja (DPC &amp; DPRt {selectedDpdOnly}) melalui fitur pencarian
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectPengurusDpd(selectedDpdOnly)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Masuk sebagai Pengurus DPD {selectedDpdOnly} (Hanya Fitur Search)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DPC */}
            {activeTab === 'DPC' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      1. Wilayah DPD:
                    </label>
                    <select
                      value={selectedDpdForDpc}
                      onChange={(e) => {
                        const newDpd = e.target.value;
                        setSelectedDpdForDpc(newDpd);
                        const reg = SULUT_REGIONS.find((r) => r.name === newDpd);
                        if (reg && reg.subdistricts.length > 0) {
                          setSelectedDpc(reg.subdistricts[0].name);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    >
                      {SULUT_REGIONS.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      2. Wilayah DPC (Kecamatan):
                    </label>
                    <select
                      value={selectedDpc}
                      onChange={(e) => setSelectedDpc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    >
                      {currentDpdObjForDpc?.subdistricts.map((s) => (
                        <option key={s.name} value={s.name}>
                          Kec. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pilihan A: Ketua DPC */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                      Pimpinan Wilayah Kecamatan
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Ketua DPC Kec. {selectedDpc}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • Mengakses <strong>Dashboard khusus wilayahnya saja</strong> (Kec. {selectedDpc})<br />
                      • Melihat struktur pengurus DPC &amp; DPRt di wilayahnya<br />
                      • Memiliki Kode Referral perekrutan
                    </p>
                  </div>
                  <button
                    onClick={handleSelectKetuaDpc}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Masuk sebagai Ketua DPC Kec. {selectedDpc} (Ada Dashboard)</span>
                  </button>
                </div>

                {/* Pilihan B: Pengurus DPC */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Pengurus Struktural DPC
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Pengurus DPC Kec. {selectedDpc}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • <strong>Dashboard dihapus</strong> (langsung ke Portal Pengurus)<br />
                      • Akses Profile Settings, Kode Referral, dan Form Pengisian Formulir<br />
                      • <strong>Fitur Pencarian:</strong> Hanya bisa akses pencarian di wilayahnya di tiap-tiap DPRt di wilayahnya
                    </p>
                  </div>
                  <button
                    onClick={handleSelectPengurusDpc}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Masuk sebagai Pengurus DPC Kec. {selectedDpc} (Pencarian Tiap DPRt)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: DPRt */}
            {activeTab === 'DPRT' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      1. DPD Kab/Kota
                    </label>
                    <select
                      value={selectedDpdForDprt}
                      onChange={(e) => {
                        const newDpd = e.target.value;
                        setSelectedDpdForDprt(newDpd);
                        const reg = SULUT_REGIONS.find((r) => r.name === newDpd);
                        if (reg && reg.subdistricts.length > 0) {
                          setSelectedDpcForDprt(reg.subdistricts[0].name);
                          setSelectedDprt(reg.subdistricts[0].villages[0] || 'Pusat');
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    >
                      {SULUT_REGIONS.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      2. DPC Kecamatan
                    </label>
                    <select
                      value={selectedDpcForDprt}
                      onChange={(e) => {
                        const newDpc = e.target.value;
                        setSelectedDpcForDprt(newDpc);
                        const sub = currentDpdObjForDprt?.subdistricts.find((s) => s.name === newDpc);
                        if (sub && sub.villages.length > 0) {
                          setSelectedDprt(sub.villages[0]);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    >
                      {currentDpdObjForDprt?.subdistricts.map((s) => (
                        <option key={s.name} value={s.name}>
                          Kec. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      3. DPRt Desa/Kelurahan
                    </label>
                    <select
                      value={selectedDprt}
                      onChange={(e) => setSelectedDprt(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    >
                      {currentDpcObjForDprt?.villages.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pilihan A: Ketua DPRt */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Ketua Ranting Desa / Kelurahan
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        DASHBOARD DIHAPUS
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Ketua DPRt {selectedDprt}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • <strong>Dashboard dihapus</strong> (tidak memiliki dashboard)<br />
                      • Hanya bisa mengakses: <strong>Profil, Keanggotaan, dan Pengurus DPRt-nya</strong><br />
                      • Memiliki Kode Referral dan formulir rekrutmen anggota
                    </p>
                  </div>
                  <button
                    onClick={handleSelectKetuaDprt}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Masuk sebagai Ketua DPRt {selectedDprt}</span>
                  </button>
                </div>

                {/* Pilihan B: Pengurus DPRt */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pengurus Ranting Desa
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        DASHBOARD DIHAPUS
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Pengurus DPRt {selectedDprt}</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      • <strong>Dashboard dihapus</strong> (langsung ke Portal Pengurus)<br />
                      • Hanya bisa mengakses: <strong>Profile Settings, Kode Referral, Page Pengisian Formulir</strong><br />
                      • <strong>Pencarian Anggota</strong> terbatas ketat di DPRt-nya sendiri ({selectedDprt})
                    </p>
                  </div>
                  <button
                    onClick={handleSelectPengurusDprt}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Masuk sebagai Pengurus DPRt {selectedDprt} (Pencarian Khusus DPRt)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer (Clean basic style) */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 min-w-0 pr-3">
              Peran Aktif: <strong className="text-slate-800 dark:text-slate-200 truncate block">{currentSession.jabatan}</strong>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoleSwitcherModal;
