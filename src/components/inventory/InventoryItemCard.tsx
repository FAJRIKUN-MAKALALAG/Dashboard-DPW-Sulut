import React, { useRef, useState, useEffect } from 'react';
import { InventoryItem } from './types';
import { InventoryProductGraphic } from './InventoryProductGraphic';
import { compressImageFileToDataUri } from './inventoryService';
import {
  Camera,
  Upload,
  Minus,
  Plus,
  Pencil,
} from 'lucide-react';

interface InventoryItemCardProps {
  item: InventoryItem;
  canManage: boolean;
  mobileCols?: 3 | 4;
  onSelectDetail: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onQuickAdjustQuantity: (item: InventoryItem, delta: number) => void;
  onQuickSetQuantity?: (item: InventoryItem, newTotal: number) => void;
  onQuickUploadPhoto: (item: InventoryItem, base64DataUri: string) => Promise<void> | void;
  onOpenCameraForItem: (item: InventoryItem) => void;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  canManage,
  mobileCols = 3,
  onSelectDetail,
  onEditItem,
  onQuickAdjustQuantity,
  onQuickSetQuantity,
  onQuickUploadPhoto,
  onOpenCameraForItem,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [qtyInputStr, setQtyInputStr] = useState<string>(String(item.jumlah));

  useEffect(() => {
    setQtyInputStr(String(item.jumlah));
  }, [item.jumlah]);

  const commitInlineQuantity = () => {
    const parsed = parseInt(qtyInputStr.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setQtyInputStr(String(item.jumlah));
      return;
    }
    if (parsed !== item.jumlah) {
      if (onQuickSetQuantity) {
        onQuickSetQuantity(item, parsed);
      } else {
        onQuickAdjustQuantity(item, parsed - item.jumlah);
      }
    } else {
      setQtyInputStr(String(item.jumlah));
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const dataUri = await compressImageFileToDataUri(file, 1000, 0.82);
      await onQuickUploadPhoto(item, dataUri);
    } catch (err) {
      console.error('Gagal mengunggah foto barang:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusDotClass =
    item.kondisi === 'Baik'
      ? 'bg-emerald-500'
      : item.kondisi === 'Perlu Perbaikan'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const isDenseMobile = mobileCols === 4;

  return (
    <div className="w-[100%] bg-white dark:bg-slate-900 border-[1px] border-slate-200/90 dark:border-slate-800 rounded-[12px] sm:rounded-[16px] overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group">
      {/* 1. Product Visual Showcase */}
      <div
        onClick={() => onSelectDetail(item)}
        className="relative w-[100%] aspect-square sm:aspect-[4/3] bg-slate-50/80 dark:bg-slate-800/50 border-b-[1px] border-slate-100 dark:border-slate-800/80 overflow-hidden cursor-pointer"
        title={item.namaBarang}
      >
        <InventoryProductGraphic
          namaBarang={item.namaBarang}
          kategori={item.kategori}
          fotoUrl={item.fotoUrl}
        />

        {/* Subtle Condition Indicator Dot (Top-Left) */}
        <div className="absolute top-[6%] left-[6%] z-20">
          <span
            className="inline-flex items-center gap-[0.3rem] px-[0.5em] py-[0.2em] rounded-[999px] text-[0.55rem] sm:text-[0.65rem] font-medium bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-700 dark:text-slate-200 border-[1px] border-slate-200/80 dark:border-slate-700 shadow-2xs"
            title={`Kondisi: ${item.kondisi}`}
          >
            <span className={`w-[6px] h-[6px] rounded-full ${statusDotClass}`} />
            <span className="hidden sm:inline">{item.ruangan}</span>
          </span>
        </div>

        {/* Floating Camera & Upload Quick Triggers */}
        {canManage && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-[6%] right-[6%] z-20 flex items-center gap-[0.25rem]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => onOpenCameraForItem(item)}
              title="Buka Kamera"
              className="text-[0.625rem] p-[0.45em] sm:p-[0.55em] rounded-[8px] bg-white/95 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border-[1px] border-slate-200/90 dark:border-slate-700 shadow-xs opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <Camera className="w-[0.7rem] h-[0.7rem] sm:w-[0.8rem] sm:h-[0.8rem] text-[#1A3282] dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              title="Upload Gambar"
              className="text-[0.625rem] p-[0.45em] sm:p-[0.55em] rounded-[8px] bg-white/95 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border-[1px] border-slate-200/90 dark:border-slate-700 shadow-xs opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <Upload className="w-[0.7rem] h-[0.7rem] sm:w-[0.8rem] sm:h-[0.8rem] text-slate-500" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Clean Product Title & Stock Control Bar */}
      <div className="w-[100%] p-[7%] sm:p-[5%] flex flex-col justify-between gap-[0.45rem] sm:gap-[0.65rem] flex-1">
        <div
          onClick={() => onSelectDetail(item)}
          className="w-[100%] cursor-pointer"
        >
          <h4
            className={`${
              isDenseMobile ? 'text-[0.65rem]' : 'text-[0.725rem]'
            } sm:text-[0.9rem] font-semibold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#1A3282] dark:group-hover:text-blue-400 transition-colors`}
            title={item.namaBarang}
          >
            {item.namaBarang}
          </h4>
        </div>

        {/* Bottom Quantity & Action Row */}
        <div className="w-[100%] pt-[0.35rem] sm:pt-[0.5rem] border-t-[1px] border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-[2%]">
          {/* Stock Count */}
          <div
            onClick={() => onSelectDetail(item)}
            className="flex items-baseline gap-[0.2rem] min-w-0 cursor-pointer"
          >
            <span
              className={`${
                isDenseMobile ? 'text-[0.8rem]' : 'text-[0.9rem]'
              } sm:text-[1.15rem] font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none`}
              data-tabular="true"
            >
              {item.jumlah.toLocaleString('id-ID')}
            </span>
            <span className="text-[0.55rem] sm:text-[0.7rem] font-medium text-slate-400 dark:text-slate-500 truncate">
              {item.satuan}
            </span>
          </div>

          {/* Controls */}
          {canManage && (
            <div className="flex items-center gap-[0.25rem] shrink-0">
              {/* Desktop Inline Stepper */}
              <div className="hidden sm:inline-flex items-center rounded-[8px] border-[1px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 p-[0.1em]">
                <button
                  type="button"
                  onClick={() => onQuickAdjustQuantity(item, -1)}
                  disabled={item.jumlah <= 0}
                  title="Kurangi 1"
                  className="text-[0.7rem] px-[0.45em] py-[0.3em] rounded-[6px] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 cursor-pointer transition-colors"
                >
                  <Minus className="w-[0.7rem] h-[0.7rem]" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={qtyInputStr}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setQtyInputStr(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={commitInlineQuantity}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  title="Ketik jumlah langsung"
                  className="w-[2rem] text-center text-[0.725rem] font-mono font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onQuickAdjustQuantity(item, 1)}
                  title="Tambah 1"
                  className="text-[0.7rem] px-[0.45em] py-[0.3em] rounded-[6px] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <Plus className="w-[0.7rem] h-[0.7rem]" />
                </button>
              </div>

              {/* Edit Trigger */}
              <button
                type="button"
                onClick={() => onEditItem(item)}
                title="Edit barang & jumlah"
                className="text-[0.625rem] sm:text-[0.725rem] p-[0.45em] sm:p-[0.5em] rounded-[7px] sm:rounded-[8px] border-[1px] border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <Pencil className="w-[0.65rem] h-[0.65rem] sm:w-[0.75rem] sm:h-[0.75rem]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
