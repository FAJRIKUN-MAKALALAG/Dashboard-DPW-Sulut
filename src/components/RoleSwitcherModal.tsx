import React, { useState } from 'react';
import { UserRole, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import {
  X,
  Shield,
  Building2,
  CheckCircle2,
  Layers,
  Home,
  Check,
  ChevronRight,
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

  const handleSelectDpdAdmin = (dpdName: string) => {
    const cleanName = dpdName.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPD',
      dpdAccess: dpdName,
      adminName: `Admin DPD NasDem ${cleanName}`,
      jabatan: `Admin DPD NasDem ${dpdName}`,
    });
    onClose();
  };

  const handleSelectDpcAdmin = () => {
    const cleanDpd = selectedDpdForDpc.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPC',
      dpdAccess: selectedDpdForDpc,
      dpcAccess: selectedDpc,
      adminName: `Admin DPC NasDem Kec. ${selectedDpc}`,
      jabatan: `Admin DPC NasDem Kec. ${selectedDpc} (${cleanDpd})`,
    });
    onClose();
  };

  const handleSelectDprtAdmin = () => {
    const cleanDpd = selectedDpdForDprt.replace(/^(Kabupaten|Kota)\s+/, '');
    onSelectSession({
      role: 'ADMIN_DPRT',
      dpdAccess: selectedDpdForDprt,
      dpcAccess: selectedDpcForDprt,
      dprtAccess: selectedDprt,
      adminName: `Admin DPRt NasDem ${selectedDprt}`,
      jabatan: `Admin DPRt NasDem ${selectedDprt} (Kec. ${selectedDpcForDprt})`,
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
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Simulasi Peran Pengguna (Role-Based Access)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih profil peran: Super Admin DPW, Admin DPD, Admin DPC, atau Admin DPRt
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('DPW')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'DPW'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1. DPW</span>
            <span className="sm:hidden">DPW</span>
          </button>

          <button
            onClick={() => setActiveTab('DPD')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'DPD'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2. DPD Kab/Kota</span>
            <span className="sm:hidden">DPD</span>
          </button>

          <button
            onClick={() => setActiveTab('DPC')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'DPC'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. DPC Kecamatan</span>
            <span className="sm:hidden">DPC</span>
          </button>

          <button
            onClick={() => setActiveTab('DPRT')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'DPRT'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4. DPRt Desa/Kel</span>
            <span className="sm:hidden">DPRt</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* TAB 1: DPW */}
          {activeTab === 'DPW' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Tingkat Provinsi &bull; Otoritas Tertinggi
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Super Admin DPW Partai NasDem Sulawesi Utara
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dapat mengakses seluruh 15 DPD Kabupaten/Kota, analitik eksekutif lengkap, ekspor laporan, 
                  serta memiliki kewenangan <strong>menghapus data langsung</strong> dan <strong>menyetujui permohonan hapus</strong> dari daerah.
                </p>
              </div>

              <button
                onClick={handleSelectSuperAdmin}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aktifkan Peran Super Admin DPW (Akses Semua 15 DPD)</span>
              </button>
            </div>
          )}

          {/* TAB 2: DPD */}
          {activeTab === 'DPD' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pilih DPD Kabupaten/Kota:
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Akses terkunci pada DPD terpilih (hanya bisa Add &amp; Edit, hapus data via ajukan ke DPW).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {SULUT_REGIONS.map((region) => {
                  const isActive =
                    currentSession.role === 'ADMIN_DPD' && currentSession.dpdAccess === region.name;
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleSelectDpdAdmin(region.name)}
                      className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{region.name}</span>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DPC */}
          {activeTab === 'DPC' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Konfigurasi Admin DPC (Tingkat Kecamatan):
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hanya dapat melihat, menambah, dan mengedit data di kecamatan miliknya.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    1. Wilayah DPD (Kab/Kota):
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

              <button
                onClick={handleSelectDpcAdmin}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  Masuk sebagai Admin DPC Kec. {selectedDpc} ({selectedDpdForDpc})
                </span>
              </button>
            </div>
          )}

          {/* TAB 4: DPRt */}
          {activeTab === 'DPRT' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Konfigurasi Admin DPRt (Tingkat Desa/Kelurahan):
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hanya dapat melihat, menambah, dan mengedit data di kelurahan/desa miliknya.
                </p>
              </div>

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

              <button
                onClick={handleSelectDprtAdmin}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  Masuk sebagai Admin DPRt {selectedDprt} (Kec. {selectedDpcForDprt})
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Peran Aktif: <strong className="text-slate-800 dark:text-slate-200">{currentSession.jabatan}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
