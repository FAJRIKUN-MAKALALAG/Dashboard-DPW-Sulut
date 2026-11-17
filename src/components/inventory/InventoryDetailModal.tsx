import React from 'react';
import { DPW_FLOORS, InventoryItem } from './types';
import { InventoryProductGraphic } from './InventoryProductGraphic';
import {
  X,
  MapPin,
  Building2,
  User,
  Pencil,
  Trash2,
  Tag,
  FileText,
  Clock,
} from 'lucide-react';

interface InventoryDetailModalProps {
  item: InventoryItem | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

export const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  item,
  canManage,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!item) return null;

  const floorMeta = DPW_FLOORS.find((f) => f.lantai === item.lantai);

  const statusDotClass =
    item.kondisi === 'Baik'
      ? 'bg-emerald-500'
      : item.kondisi === 'Perlu Perbaikan'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 w-[100vw] max-w-[100vw] min-h-[100vh] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-[3%] sm:p-[2%] animate-backdrop-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[100%] sm:w-[92%] md:w-[75%] lg:w-[58%] max-w-[100%] bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-800 rounded-[16px] shadow-2xl overflow-hidden animate-modal-pop max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="w-[100%] px-[4%] py-[0.85rem] border-b-[1px] border-slate-200 dark:border-slate-800 flex items-center justify-between gap-[2%]">
          <div className="flex items-center gap-[0.5rem] min-w-0">
            <span className="px-[0.65em] py-[0.25em] rounded-[6px] text-[0.65rem] font-bold font-mono bg-[#1A3282] text-white dark:bg-[#21409A] shrink-0">
              {item.kodeBarang}
            </span>
            <h3 className="text-[0.9375rem] sm:text-[1rem] font-bold text-slate-900 dark:text-white truncate">
              Rincian Barang Inventaris
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[0.75rem] p-[0.45em] rounded-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-[1rem] h-[1rem]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="w-[100%] p-[4%] overflow-y-auto space-y-[1rem]">
          <div className="w-[100%] flex flex-col sm:flex-row items-start justify-between gap-[3%]">
            {/* Left: Product Image Preview */}
            <div className="w-[100%] sm:w-[42%] mb-[0.75rem] sm:mb-0">
              <div className="w-[100%] aspect-[4/3] rounded-[12px] border-[1px] border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/60">
                <InventoryProductGraphic
                  namaBarang={item.namaBarang}
                  kategori={item.kategori}
                  fotoUrl={item.fotoUrl}
                />
              </div>
              <div className="w-[100%] mt-[0.6rem] flex items-center justify-between px-[4%] py-[0.55rem] rounded-[12px] bg-slate-50 dark:bg-slate-800/50 border-[1px] border-slate-200/80 dark:border-slate-800 text-[0.75rem]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status Aset</span>
                <span className="inline-flex items-center gap-[0.35rem] font-semibold text-slate-800 dark:text-slate-200">
                  <span className={`w-[8px] h-[8px] rounded-full ${statusDotClass}`} />
                  {item.kondisi}
                </span>
              </div>
            </div>

            {/* Right: Core Product Specifications */}
            <div className="w-[100%] sm:w-[55%] flex flex-col justify-between space-y-[0.75rem]">
              <div className="w-[100%]">
                <div className="inline-flex items-center gap-[0.35rem] text-[0.6875rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Tag className="w-[0.75rem] h-[0.75rem]" />
                  <span>{item.kategori}</span>
                </div>
                <h2 className="text-[1.0625rem] sm:text-[1.125rem] font-bold text-slate-900 dark:text-white mt-[0.2rem] leading-snug">
                  {item.namaBarang}
                </h2>
                {item.merkSpesifikasi && (
                  <p className="text-[0.75rem] font-medium text-slate-600 dark:text-slate-300 mt-[0.25rem]">
                    Spesifikasi: {item.merkSpesifikasi}
                  </p>
                )}

                {/* Location Box */}
                <div className="w-[100%] mt-[0.75rem] p-[3.5%] rounded-[12px] bg-slate-50/80 dark:bg-slate-800/50 border-[1px] border-slate-200/80 dark:border-slate-800 space-y-[0.4rem]">
                  <div className="flex items-center gap-[0.45rem] text-[0.75rem]">
                    <Building2 className="w-[0.875rem] h-[0.875rem] text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">Lantai Gedung:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Lantai {item.lantai} ({floorMeta?.shortTitle || 'Gedung DPW'})
                    </span>
                  </div>
                  <div className="flex items-center gap-[0.45rem] text-[0.75rem]">
                    <MapPin className="w-[0.875rem] h-[0.875rem] text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">Ruangan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.ruangan}
                    </span>
                  </div>
                  <div className="flex items-center gap-[0.45rem] text-[0.75rem]">
                    <User className="w-[0.875rem] h-[0.875rem] text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">Penanggung Jawab:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.penanggungJawab || 'Sekretariat DPW Sulut'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity & Condition Breakdown (% widths) */}
              <div className="w-[100%] flex flex-wrap items-center justify-between gap-[2%] pt-[0.25rem]">
                <div className="w-[23.5%] p-[2.5%] rounded-[12px] bg-slate-100/80 dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                    Total
                  </span>
                  <span className="text-[1rem] font-bold font-mono text-slate-900 dark:text-white">
                    {item.jumlah}
                  </span>
                  <span className="text-[0.625rem] text-slate-400 block">{item.satuan}</span>
                </div>
                <div className="w-[23.5%] p-[2.5%] rounded-[12px] bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                    Baik
                  </span>
                  <span className="text-[1rem] font-bold font-mono text-slate-900 dark:text-white">
                    {item.jumlahBaik}
                  </span>
                  <span className="text-[0.625rem] text-slate-400 block">{item.satuan}</span>
                </div>
                <div className="w-[23.5%] p-[2.5%] rounded-[12px] bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                    Servis
                  </span>
                  <span className="text-[1rem] font-bold font-mono text-slate-900 dark:text-white">
                    {item.jumlahPerbaikan}
                  </span>
                  <span className="text-[0.625rem] text-slate-400 block">{item.satuan}</span>
                </div>
                <div className="w-[23.5%] p-[2.5%] rounded-[12px] bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                    Rusak
                  </span>
                  <span className="text-[1rem] font-bold font-mono text-slate-900 dark:text-white">
                    {item.jumlahRusak}
                  </span>
                  <span className="text-[0.625rem] text-slate-400 block">{item.satuan}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keterangan / Catatan */}
          <div className="w-[100%] p-[3.5%] rounded-[12px] bg-slate-50/70 dark:bg-slate-800/40 border-[1px] border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-[0.4rem] text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.25rem]">
              <FileText className="w-[0.875rem] h-[0.875rem] text-slate-400" />
              <span>Catatan &amp; Keterangan Fisik</span>
            </div>
            <p className="text-[0.75rem] text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.keterangan || 'Tidak ada catatan tambahan untuk barang inventaris ini.'}
            </p>
            {(item.diubahOleh || item.updatedAt) && (
              <div className="mt-[0.6rem] pt-[0.5rem] border-t-[1px] border-slate-200/60 dark:border-slate-700/60 flex items-center gap-[0.35rem] text-[0.6875rem] text-slate-400">
                <Clock className="w-[0.75rem] h-[0.75rem]" />
                <span>
                  Terakhir diperbarui oleh <strong>{item.diubahOleh || 'Admin DPW'}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="w-[100%] px-[4%] py-[0.75rem] bg-slate-50 dark:bg-slate-900 border-t-[1px] border-slate-200 dark:border-slate-800 flex items-center justify-between gap-[2%]">
          {canManage ? (
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="inline-flex items-center gap-[0.35rem] text-[0.75rem] font-semibold px-[0.95em] py-[0.55em] rounded-[12px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-[1px] border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer transition-colors"
            >
              <Trash2 className="w-[0.875rem] h-[0.875rem]" />
              <span>Hapus</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-[0.5rem]">
            <button
              type="button"
              onClick={onClose}
              className="btn-white text-[0.75rem] font-semibold px-[1.1em] py-[0.55em] rounded-[12px] cursor-pointer"
            >
              Tutup
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="inline-flex items-center gap-[0.35rem] text-[0.75rem] font-semibold px-[1.1em] py-[0.55em] rounded-[12px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white cursor-pointer shadow-2xs transition-colors"
              >
                <Pencil className="w-[0.875rem] h-[0.875rem]" />
                <span>Edit Barang &amp; Stok</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
