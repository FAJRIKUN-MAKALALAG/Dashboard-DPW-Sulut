import React, { useState, useEffect, useMemo } from 'react';
import { UserSession } from '../../types';
import { DPW_FLOORS, InventoryItem } from './types';
import { inventoryService, loadLocalInventory } from './inventoryService';
import { InventoryItemCard } from './InventoryItemCard';
import { InventoryDetailModal } from './InventoryDetailModal';
import { InventoryFormModal } from './InventoryFormModal';
import { InventoryCameraModal } from './InventoryCameraModal';
import {
  Plus,
  Search,
  Package,
  X,
  LayoutGrid,
} from 'lucide-react';

interface InventoryPageProps {
  session?: UserSession;
  showToast?: (msg: string) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ session, showToast }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => loadLocalInventory());
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileGridCols, setMobileGridCols] = useState<3 | 4>(3);

  // Modals State
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [cameraTargetItem, setCameraTargetItem] = useState<InventoryItem | null>(null);

  // Hanya Super Admin yang memiliki akses penuh ke fitur inventaris ini
  const canManage = session?.role === 'SUPER_ADMIN';

  useEffect(() => {
    inventoryService.getAll().then((data) => setItems(data));
  }, []);

  const displayedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((it) => it.lantai === selectedFloor)
      .filter((it) => {
        if (!q) return true;
        return (
          it.namaBarang.toLowerCase().includes(q) ||
          it.ruangan.toLowerCase().includes(q) ||
          it.kodeBarang.toLowerCase().includes(q)
        );
      });
  }, [items, selectedFloor, searchQuery]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSaveItem = async (payload: Partial<InventoryItem>, existingId?: string) => {
    if (existingId) {
      const updated = await inventoryService.update(existingId, payload);
      setItems((prev) =>
        prev
          .map((i) => (i.id === existingId ? updated : i))
          .sort((a, b) => a.lantai - b.lantai || a.kodeBarang.localeCompare(b.kodeBarang))
      );
      if (detailItem?.id === existingId) {
        setDetailItem(updated);
      }
      if (updated.lantai !== selectedFloor) {
        setSelectedFloor(updated.lantai);
      }
      showToast?.(`"${updated.namaBarang}" berhasil diperbarui.`);
    } else {
      const created = await inventoryService.create({
        ...payload,
        lantai: payload.lantai || selectedFloor,
      });
      setItems((prev) =>
        [...prev, created].sort(
          (a, b) => a.lantai - b.lantai || a.kodeBarang.localeCompare(b.kodeBarang)
        )
      );
      if (created.lantai !== selectedFloor) {
        setSelectedFloor(created.lantai);
      }
      showToast?.(`"${created.namaBarang}" ditambahkan ke Lantai ${created.lantai}.`);
    }
  };

  const handleQuickAdjustQuantity = async (item: InventoryItem, delta: number) => {
    const nextJumlah = Math.max(0, item.jumlah + delta);
    if (nextJumlah === item.jumlah) return;
    const nextBaik = Math.max(0, item.jumlahBaik + delta);
    const updated = await inventoryService.update(item.id, {
      jumlah: nextJumlah,
      jumlahBaik: nextBaik,
      jumlahPerbaikan: item.jumlahPerbaikan,
      jumlahRusak: item.jumlahRusak,
    });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    if (detailItem?.id === item.id) {
      setDetailItem(updated);
    }
  };

  const handleQuickSetQuantity = async (item: InventoryItem, newTotal: number) => {
    const cleanTotal = Math.max(0, newTotal);
    const nextBaik = Math.max(
      0,
      cleanTotal - (item.jumlahPerbaikan || 0) - (item.jumlahRusak || 0)
    );
    const updated = await inventoryService.update(item.id, {
      jumlah: nextBaik + (item.jumlahPerbaikan || 0) + (item.jumlahRusak || 0),
      jumlahBaik: nextBaik,
      jumlahPerbaikan: item.jumlahPerbaikan,
      jumlahRusak: item.jumlahRusak,
    });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    if (detailItem?.id === item.id) {
      setDetailItem(updated);
    }
    showToast?.(`Jumlah "${item.namaBarang}" diubah menjadi ${updated.jumlah} ${updated.satuan}.`);
  };

  const handleQuickUploadPhoto = async (item: InventoryItem, base64DataUri: string) => {
    const updated = await inventoryService.update(item.id, { fotoUrl: base64DataUri });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    if (detailItem?.id === item.id) {
      setDetailItem(updated);
    }
    showToast?.(`Foto "${item.namaBarang}" disimpan.`);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const ok = window.confirm(`Hapus "${item.namaBarang}" dari Lantai ${item.lantai}?`);
    if (!ok) return;
    await inventoryService.remove(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setDetailItem(null);
    showToast?.(`"${item.namaBarang}" dihapus.`);
  };

  return (
    <div className="w-[100%] max-w-[100vw] space-y-[0.75rem]">
      {/* ========================================================================= */}
      {/* 1. COMPACT SINGLE-LINE TOOLBAR (TIDAK MENGHALANGI PANDANGAN BARANG)       */}
      {/* ========================================================================= */}
      <div className="w-[100%] bg-white dark:bg-slate-900 border-[1px] border-slate-200/90 dark:border-slate-800 rounded-[14px] px-[2.5%] sm:px-[1.2%] py-[0.5rem] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-[0.5rem]">
        {/* Left: 5-Floor Inline Segmented Pills (Satu Baris Rapi, Tanpa Turun Baris) */}
        <div className="w-[100%] md:w-[52%] lg:w-[48%] grid grid-cols-5 gap-[1%] bg-slate-100/90 dark:bg-slate-800/80 p-[0.2rem] rounded-[10px]">
          {DPW_FLOORS.map((f) => {
            const count = items.filter((i) => i.lantai === f.lantai).length;
            const isActive = selectedFloor === f.lantai;
            return (
              <button
                key={f.lantai}
                type="button"
                onClick={() => setSelectedFloor(f.lantai)}
                className={`w-[100%] text-[0.6875rem] sm:text-[0.75rem] font-semibold px-[0.35em] py-[0.45em] rounded-[8px] whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center justify-center gap-[0.25rem] ${
                  isActive
                    ? 'bg-[#1A3282] text-white dark:bg-[#21409A] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="leading-none">
                  <span className="sm:hidden">Lt {f.lantai}</span>
                  <span className="hidden sm:inline">Lantai {f.lantai}</span>
                </span>
                {count > 0 && (
                  <span
                    className={`px-[0.4em] py-[0.05em] rounded-[999px] text-[0.6rem] font-mono font-bold leading-none ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search Input + Grid Switcher (3/4) + Tombol Tambah (Satu Baris) */}
        <div className="w-[100%] md:w-[46%] lg:w-[48%] flex items-center justify-between md:justify-end gap-[1.8%]">
          {/* Compact Search Input */}
          <div className="flex-1 relative min-w-0">
            <Search className="w-[0.8rem] h-[0.8rem] text-slate-400 absolute left-[0.65rem] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari barang Lantai ${selectedFloor}...`}
              className="w-[100%] pl-[1.85rem] pr-[1.6rem] py-[0.42rem] rounded-[10px] text-[0.725rem] bg-slate-50 dark:bg-slate-800/70 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#1A3282]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-[0.45rem] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-[0.15em]"
              >
                <X className="w-[0.75rem] h-[0.75rem]" />
              </button>
            )}
          </div>

          {/* Compact 3 / 4 Grid Pill */}
          <div className="inline-flex items-center rounded-[10px] border-[1px] border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 p-[0.15em] shrink-0">
            <button
              type="button"
              onClick={() => setMobileGridCols(3)}
              title="Tampilan 3 Kolom Sejajar"
              className={`text-[0.65rem] sm:text-[0.7rem] font-semibold px-[0.6em] py-[0.38em] rounded-[7px] flex items-center gap-[0.2rem] cursor-pointer whitespace-nowrap transition-all ${
                mobileGridCols === 3
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-[0.68rem] h-[0.68rem] hidden lg:inline" />
              <span>3 Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileGridCols(4)}
              title="Tampilan 4 Kolom Sejajar"
              className={`text-[0.65rem] sm:text-[0.7rem] font-semibold px-[0.6em] py-[0.38em] rounded-[7px] flex items-center gap-[0.2rem] cursor-pointer whitespace-nowrap transition-all ${
                mobileGridCols === 4
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-[0.68rem] h-[0.68rem] hidden lg:inline" />
              <span>4 Grid</span>
            </button>
          </div>

          {/* Primary Add Button */}
          {canManage && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="text-[0.7rem] sm:text-[0.75rem] font-semibold px-[0.9em] py-[0.5em] rounded-[10px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white flex items-center gap-[0.25rem] whitespace-nowrap cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-[0.8rem] h-[0.8rem]" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LANGSUNG GRID CARD BARANG PADA LANTAI AKTIF                            */}
      {/* ========================================================================= */}
      <div key={selectedFloor} className="w-[100%] animate-tab-enter">
        {displayedItems.length > 0 ? (
          <div
            className={`w-[100%] flex flex-wrap items-stretch justify-start ${
              mobileGridCols === 4
                ? 'gap-x-[1.6%] gap-y-[0.6rem] sm:gap-y-[0.9rem]'
                : 'gap-x-[2%] gap-y-[0.7rem] sm:gap-y-[1rem]'
            }`}
          >
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className={
                  mobileGridCols === 4
                    ? 'w-[23.8%] flex'
                    : 'w-[32%] xl:w-[23.5%] flex'
                }
              >
                <InventoryItemCard
                  item={item}
                  canManage={canManage}
                  mobileCols={mobileGridCols}
                  onSelectDetail={setDetailItem}
                  onEditItem={handleOpenEditModal}
                  onQuickAdjustQuantity={handleQuickAdjustQuantity}
                  onQuickSetQuantity={handleQuickSetQuantity}
                  onQuickUploadPhoto={handleQuickUploadPhoto}
                  onOpenCameraForItem={(target) => setCameraTargetItem(target)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-[100%] bg-white dark:bg-slate-900 border-[1px] border-slate-200/90 dark:border-slate-800 rounded-[14px] py-[2.75rem] px-[5%] text-center shadow-2xs">
            <div className="w-[2.6rem] h-[2.6rem] rounded-[12px] bg-slate-100 dark:bg-slate-800 border-[1px] border-slate-200/70 dark:border-slate-700 flex items-center justify-center mx-auto mb-[0.6rem] text-slate-400 dark:text-slate-500">
              <Package className="w-[1.2rem] h-[1.2rem]" />
            </div>
            <h3 className="text-[0.825rem] sm:text-[0.9rem] font-bold text-slate-900 dark:text-white">
              {searchQuery.trim()
                ? `Tidak ada "${searchQuery}" di Lantai ${selectedFloor}`
                : `Lantai ${selectedFloor} Kosong`}
            </h3>
            {canManage && !searchQuery.trim() && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-[0.75rem] text-[0.725rem] font-semibold px-[1.1em] py-[0.55em] rounded-[10px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white inline-flex items-center gap-[0.3rem] cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-[0.8rem] h-[0.8rem]" />
                <span>Tambah Barang</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS: DETAIL, FORM TAMBAH/EDIT, & KAMERA                             */}
      {/* ========================================================================= */}
      <InventoryDetailModal
        item={detailItem}
        canManage={canManage}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteItem}
      />

      <InventoryFormModal
        isOpen={isFormOpen}
        editingItem={editingItem}
        defaultFloor={selectedFloor}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveItem}
      />

      <InventoryCameraModal
        isOpen={Boolean(cameraTargetItem)}
        title={
          cameraTargetItem
            ? `Ambil Foto: ${cameraTargetItem.namaBarang}`
            : 'Ambil Foto Barang'
        }
        onClose={() => setCameraTargetItem(null)}
        onCapture={async (dataUri) => {
          if (cameraTargetItem) {
            await handleQuickUploadPhoto(cameraTargetItem, dataUri);
            setCameraTargetItem(null);
          }
        }}
      />
    </div>
  );
};
