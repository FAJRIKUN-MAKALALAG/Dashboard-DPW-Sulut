import React from 'react';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { Building, MapPin, Layers, Edit3, Save, X } from 'lucide-react';

interface MatrixHeaderControlProps {
  tingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  setTingkat: (t: 'DPW' | 'DPD' | 'DPC' | 'DPRt') => void;
  selectedDpd: string;
  setSelectedDpd: (dpd: string) => void;
  selectedDpc: string;
  setSelectedDpc: (dpc: string) => void;
  selectedDprt: string;
  setSelectedDprt: (dprt: string) => void;
  isEditMode: boolean;
  setIsEditMode: (edit: boolean) => void;
  onSaveToDatabase: () => void;
  onClose: () => void;
}

export const MatrixHeaderControl: React.FC<MatrixHeaderControlProps> = ({
  tingkat,
  setTingkat,
  selectedDpd,
  setSelectedDpd,
  selectedDpc,
  setSelectedDpc,
  selectedDprt,
  setSelectedDprt,
  isEditMode,
  setIsEditMode,
  onSaveToDatabase,
  onClose,
}) => {
  const currentRegion = SULUT_REGIONS.find((r) => r.name === selectedDpd) || SULUT_REGIONS[0];
  const currentSubdistrict =
    currentRegion?.subdistricts.find((s) => s.name === selectedDpc) ||
    currentRegion?.subdistricts[0];

  return (
    <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/70">
      {/* Level Switcher */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
        {(['DPW', 'DPD', 'DPC', 'DPRt'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setTingkat(lvl)}
            className={`px-3 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
              tingkat === lvl
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Territory Selectors */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {tingkat !== 'DPW' && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <select
              value={selectedDpd}
              onChange={(e) => {
                const newDpd = e.target.value;
                setSelectedDpd(newDpd);
                const reg = SULUT_REGIONS.find((r) => r.name === newDpd);
                if (reg && reg.subdistricts.length > 0) {
                  setSelectedDpc(reg.subdistricts[0].name);
                  setSelectedDprt(reg.subdistricts[0].villages[0] || 'Pusat');
                }
              }}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {SULUT_REGIONS.map((r) => (
                <option key={r.id} value={r.name} className="dark:bg-slate-900">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(tingkat === 'DPC' || tingkat === 'DPRt') && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <select
              value={selectedDpc}
              onChange={(e) => {
                const newDpc = e.target.value;
                setSelectedDpc(newDpc);
                const sub = currentRegion?.subdistricts.find((s) => s.name === newDpc);
                if (sub && sub.villages.length > 0) {
                  setSelectedDprt(sub.villages[0]);
                }
              }}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {(currentRegion?.subdistricts || []).map((s) => (
                <option key={s.name} value={s.name} className="dark:bg-slate-900">
                  Kec. {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {tingkat === 'DPRt' && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <select
              value={selectedDprt}
              onChange={(e) => setSelectedDprt(e.target.value)}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {(currentSubdistrict?.villages || []).map((v) => (
                <option key={v} value={v} className="dark:bg-slate-900">
                  Kel/Desa {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs ${
            isEditMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'btn-white text-slate-700 dark:text-slate-300'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditMode ? 'Mode Edit Aktif' : 'Edit Tabel'}</span>
        </button>

        <button
          onClick={onSaveToDatabase}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan ke Database</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
