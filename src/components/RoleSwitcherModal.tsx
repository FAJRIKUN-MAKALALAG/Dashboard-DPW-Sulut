import React from 'react';
import { UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { X, Shield, User, Building2, CheckCircle2 } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleSelectSuperAdmin = () => {
    onSelectSession({
      role: 'SUPER_ADMIN',
      dpdAccess: 'ALL',
      adminName: 'Bappilu & OKK DPW NasDem Sulut',
      jabatan: 'Super Admin DPW Partai NasDem Sulut',
    });
    onClose();
  };

  const handleSelectDpdAdmin = (dpdName: string) => {
    onSelectSession({
      role: 'ADMIN_DPD',
      dpdAccess: dpdName,
      adminName: `Admin DPD NasDem ${dpdName.replace(/^(Kabupaten|Kota)\s+/, '')}`,
      jabatan: `Admin DPD NasDem ${dpdName}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Simulasi Akses Peran Pengguna (Role-Based Access)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pilih profil peran untuk menguji hak akses Super Admin DPW vs Admin DPD Kab/Kota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Option 1: Super Admin */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Tingkat Provinsi (Akses Penuh):
            </h4>
            <button
              onClick={handleSelectSuperAdmin}
              className={`btn-white w-full p-3.5 rounded-xl text-left flex items-start justify-between gap-3 cursor-pointer ${
                currentSession.role === 'SUPER_ADMIN'
                  ? 'ring-2 ring-blue-500 border-blue-500 font-semibold'
                  : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Super Admin (DPW Partai NasDem Sulut)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Memiliki hak akses tertinggi ke seluruh 15 DPD Kabupaten/Kota Partai NasDem, analitik eksekutif provinsi, cetak laporan atasan, dan import/export massal.
                </p>
              </div>
              {currentSession.role === 'SUPER_ADMIN' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Option 2: Admin DPD (15 Kab/Kota) */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Tingkat Daerah (Admin DPD Kabupaten/Kota):
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Admin DPD hanya dapat memantau dan mengubah status anggota di wilayahnya sendiri (terkunci).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {SULUT_REGIONS.map((region) => {
                const isActive =
                  currentSession.role === 'ADMIN_DPD' && currentSession.dpdAccess === region.name;
                return (
                  <button
                    key={region.id}
                    onClick={() => handleSelectDpdAdmin(region.name)}
                    className={`btn-white p-2.5 rounded-lg text-left text-xs flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-blue-500 border-blue-500 font-semibold'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{region.name}</span>
                    </div>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="btn-white px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
