import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { GridRowItem } from './matrixSheetTypes';
import { MatrixMemberAvatar } from './MatrixMemberAvatar';
import { isGeneratedNik, isGeneratedEkta, isIncompleteNik } from '../../../utils/generatedIds';
import { isDefinitiveLeader } from '../../../utils/jobMatchingUtils';

interface MobileRowCardProps {
  row: GridRowItem;
  idx: number;
  isEditMode: boolean;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onCellChange: (id: string, field: keyof GridRowItem, value: string) => void;
  onDeleteRow: (id: string) => void;
  onInsertRow?: (targetId: string, position: 'above' | 'below') => void;
}

const mobileInputCls =
  'w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900';

export const MatrixMobileRowCard: React.FC<MobileRowCardProps> = ({
  row,
  idx,
  isEditMode,
  isSelected,
  onToggleSelect,
  onCellChange,
  onDeleteRow,
  onInsertRow,
}) => {
  const isFilled = row.namaLengkap.trim() !== '';
  const isLeader = isDefinitiveLeader(row.jabatan);
  const nik = isGeneratedNik(row.nik) ? '' : row.nik;
  const ekta = isGeneratedEkta(row.nomorEKTA) ? '' : row.nomorEKTA;

  // COMPACT 1-LINE ROW FOR VACANT SLOTS (WHEN NOT IN EDIT MODE)
  if (!isEditMode && !isFilled) {
    return (
      <div
        className={`px-3 py-2.5 flex items-center justify-between gap-2 transition-colors ${
          isSelected
            ? 'bg-rose-50 dark:bg-rose-950/30'
            : 'bg-slate-50/60 dark:bg-slate-950/30'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="w-3.5 h-3.5 rounded cursor-pointer shrink-0"
          />
          <span className="font-mono font-bold text-[11px] text-slate-400 w-5 shrink-0">
            {idx + 1}.
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
            {row.jabatan}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDB813]/15 dark:bg-slate-900 text-[#9E6706] dark:text-[#FDB813] border border-[#FDB813]/30 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FDB813]" />
            <span>Belum Terisi</span>
          </span>
          <button
            type="button"
            onClick={() => onDeleteRow(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
            title="Hapus slot lowong"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // FULL CARD FOR FILLED MEMBERS OR EDIT MODE
  const details: {
    label: string;
    field: keyof GridRowItem;
    value: string;
    placeholder: string;
    mono?: boolean;
    type?: string;
  }[] = [
    { label: 'NIK KTP', field: 'nik', value: nik, placeholder: '16 Digit NIK', mono: true },
    { label: 'No. E-KTA', field: 'nomorEKTA', value: ekta, placeholder: 'Nomor E-KTA', mono: true },
    { label: 'Telepon / WA', field: 'nomorHP', value: row.nomorHP, placeholder: '08xxxxxxxxxx', mono: true, type: 'tel' },
    { label: 'Email', field: 'email', value: row.email, placeholder: 'email@nasdem.id', type: 'email' },
    { label: 'Sosial Media', field: 'sosmed', value: row.sosmed, placeholder: '@instagram' },
  ];

  return (
    <div
      className={`p-3.5 transition-colors ${
        isSelected
          ? 'bg-rose-50 dark:bg-rose-950/40'
          : 'bg-white dark:bg-slate-900'
      }`}
    >
      {/* Top row: checkbox, number, status, actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="w-3.5 h-3.5 rounded cursor-pointer shrink-0"
          />
          <span className="font-mono font-bold text-xs text-slate-400">#{idx + 1}</span>
          {isLeader && (
            <span className="px-1.5 py-0.5 rounded font-black text-[9.5px] bg-[#FDB813] text-slate-950 uppercase">
              Ketua
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${isFilled ? 'bg-emerald-500' : 'bg-[#FDB813]'}`} />
            <span>{isFilled ? 'Terisi' : 'Belum Terisi'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onInsertRow && (
            <button
              type="button"
              onClick={() => onInsertRow(row.id, 'below')}
              className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Sisip
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteRow(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
            aria-label="Hapus baris"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Jabatan & Nama */}
      <div className="mt-2.5">
        {isEditMode ? (
          <div className="space-y-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jabatan</span>
              <input
                type="text"
                value={row.jabatan}
                onChange={(e) => onCellChange(row.id, 'jabatan', e.target.value)}
                className={`${mobileInputCls} mt-0.5 font-semibold`}
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nama Lengkap (KTP)</span>
              <input
                type="text"
                placeholder="Masukkan Nama KTP..."
                value={row.namaLengkap}
                onChange={(e) => onCellChange(row.id, 'namaLengkap', e.target.value)}
                className={`${mobileInputCls} mt-0.5 font-bold`}
              />
            </label>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <MatrixMemberAvatar
              fotoProfilUrl={row.fotoProfilUrl}
              namaLengkap={row.namaLengkap}
              sizeCls="w-8 h-10"
              initialsCls="text-[10px]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {row.jabatan}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {row.namaLengkap}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Detail Grid */}
      {isEditMode ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {details.map((d) => (
            <label key={d.field} className={d.field === 'sosmed' ? 'col-span-2' : 'block'}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{d.label}</span>
              <input
                type={d.type || 'text'}
                inputMode={d.field === 'nik' || d.field === 'nomorHP' ? 'numeric' : undefined}
                placeholder={d.placeholder}
                value={d.value}
                onChange={(e) => onCellChange(row.id, d.field, e.target.value)}
                className={`${mobileInputCls} mt-0.5 ${d.mono ? 'font-mono' : ''}`}
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">NIK KTP</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">
                {nik || '-'}
              </span>
              {isIncompleteNik(nik) && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-sans font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
                  {nik.replace(/[^0-9]/g, '').length} digit
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">No. E-KTA</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
              {ekta || '-'}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Telepon / WA</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
              {row.nomorHP || '-'}
            </span>
          </div>
          <div>
            <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Email / Sosmed</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {row.email || row.sosmed || '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

