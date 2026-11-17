import React, { useState, useEffect, useRef } from 'react';
import {
  DPW_FLOORS,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  InventoryCondition,
  InventoryItem,
} from './types';
import {
  compressImageFileToDataUri,
  deriveInventoryCondition,
  resolveInventoryPhotoUrl,
} from './inventoryService';
import { InventoryCameraModal } from './InventoryCameraModal';
import { X, Upload, Camera, Trash2, Check, Minus, Plus } from 'lucide-react';

interface InventoryFormModalProps {
  isOpen: boolean;
  editingItem: InventoryItem | null;
  defaultFloor?: number;
  onClose: () => void;
  onSave: (payload: Partial<InventoryItem>, existingId?: string) => Promise<void> | void;
}

export const InventoryFormModal: React.FC<InventoryFormModalProps> = ({
  isOpen,
  editingItem,
  defaultFloor = 1,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lantai, setLantai] = useState<number>(defaultFloor || 1);
  const [namaBarang, setNamaBarang] = useState<string>('');
  const [kodeBarang, setKodeBarang] = useState<string>('');
  const [kategori, setKategori] = useState<string>(INVENTORY_CATEGORIES[0]);
  const [ruangan, setRuangan] = useState<string>('');
  const [satuan, setSatuan] = useState<string>('Unit');

  // Gunakan string state untuk input angka agar mudah dihapus (backspace) & diketik ulang
  const [jumlahTotalStr, setJumlahTotalStr] = useState<string>('1');
  const [jumlahBaikStr, setJumlahBaikStr] = useState<string>('1');
  const [jumlahPerbaikanStr, setJumlahPerbaikanStr] = useState<string>('0');
  const [jumlahRusakStr, setJumlahRusakStr] = useState<string>('0');

  const [merkSpesifikasi, setMerkSpesifikasi] = useState<string>('');
  const [penanggungJawab, setPenanggungJawab] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingItem) {
      const jb = editingItem.jumlahBaik ?? editingItem.jumlah ?? 1;
      const jp = editingItem.jumlahPerbaikan ?? 0;
      const jr = editingItem.jumlahRusak ?? 0;
      const tot = editingItem.jumlah ?? jb + jp + jr;

      setLantai(editingItem.lantai || 1);
      setNamaBarang(editingItem.namaBarang || '');
      setKodeBarang(editingItem.kodeBarang || '');
      setKategori(editingItem.kategori || INVENTORY_CATEGORIES[0]);
      setRuangan(editingItem.ruangan || '');
      setSatuan(editingItem.satuan || 'Unit');
      setJumlahTotalStr(String(tot));
      setJumlahBaikStr(String(jb));
      setJumlahPerbaikanStr(String(jp));
      setJumlahRusakStr(String(jr));
      setMerkSpesifikasi(editingItem.merkSpesifikasi || '');
      setPenanggungJawab(editingItem.penanggungJawab || '');
      setKeterangan(editingItem.keterangan || '');
      setFotoUrl(editingItem.fotoUrl || '');
    } else {
      const targetFloor = defaultFloor >= 1 && defaultFloor <= 5 ? defaultFloor : 1;
      const floorInfo = DPW_FLOORS.find((f) => f.lantai === targetFloor);
      setLantai(targetFloor);
      setNamaBarang('');
      setKodeBarang('');
      setKategori(INVENTORY_CATEGORIES[0]);
      setRuangan(floorInfo?.defaultRooms[0] || `Ruang Lantai ${targetFloor}`);
      setSatuan('Unit');
      setJumlahTotalStr('1');
      setJumlahBaikStr('1');
      setJumlahPerbaikanStr('0');
      setJumlahRusakStr('0');
      setMerkSpesifikasi('');
      setPenanggungJawab('Sekretariat DPW');
      setKeterangan('');
      setFotoUrl('');
    }
  }, [isOpen, editingItem, defaultFloor]);

  if (!isOpen) return null;

  const currentFloorMeta = DPW_FLOORS.find((f) => f.lantai === lantai) || DPW_FLOORS[0];

  const sanitizeDigits = (val: string): string => val.replace(/[^0-9]/g, '');
  const toInt = (val: string): number => {
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  };

  const numBaik = toInt(jumlahBaikStr);
  const numPerbaikan = toInt(jumlahPerbaikanStr);
  const numRusak = toInt(jumlahRusakStr);
  const numTotal = toInt(jumlahTotalStr);

  // Saat user mengetik langsung di "Jumlah Total Barang", otomatis sesuaikan jumlahBaik
  const handleTotalChange = (raw: string) => {
    const cleaned = sanitizeDigits(raw);
    setJumlahTotalStr(cleaned);
    const nextTotal = toInt(cleaned);
    const nextBaik = Math.max(0, nextTotal - numPerbaikan - numRusak);
    setJumlahBaikStr(String(nextBaik));
  };

  const adjustTotalBy = (delta: number) => {
    const nextTotal = Math.max(0, numTotal + delta);
    setJumlahTotalStr(String(nextTotal));
    const nextBaik = Math.max(0, nextTotal - numPerbaikan - numRusak);
    setJumlahBaikStr(String(nextBaik));
  };

  // Saat user mengetik di rincian kondisi (Baik / Servis / Rusak), otomatis hitung ulang Total
  const handleBaikChange = (raw: string) => {
    const cleaned = sanitizeDigits(raw);
    setJumlahBaikStr(cleaned);
    const jb = toInt(cleaned);
    setJumlahTotalStr(String(jb + numPerbaikan + numRusak));
  };

  const handlePerbaikanChange = (raw: string) => {
    const cleaned = sanitizeDigits(raw);
    setJumlahPerbaikanStr(cleaned);
    const jp = toInt(cleaned);
    setJumlahTotalStr(String(numBaik + jp + numRusak));
  };

  const handleRusakChange = (raw: string) => {
    const cleaned = sanitizeDigits(raw);
    setJumlahRusakStr(cleaned);
    const jr = toInt(cleaned);
    setJumlahTotalStr(String(numBaik + numPerbaikan + jr));
  };

  const computedKondisi: InventoryCondition = deriveInventoryCondition(
    numBaik,
    numPerbaikan,
    numRusak
  );

  const handleFloorChange = (newFloor: number) => {
    setLantai(newFloor);
    const meta = DPW_FLOORS.find((f) => f.lantai === newFloor);
    if (!editingItem && meta && meta.defaultRooms.length > 0) {
      setRuangan(meta.defaultRooms[0]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUri(file, 1000, 0.82);
      setFotoUrl(compressed);
    } catch {
      setErrorMsg('Gagal memproses berkas foto. Pastikan format JPG/PNG/WebP.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      setErrorMsg('Nama barang inventaris wajib diisi.');
      return;
    }

    const finalTotal = Math.max(0, numTotal);
    const sumBreakdown = numBaik + numPerbaikan + numRusak;
    const finalBaik =
      sumBreakdown === finalTotal
        ? numBaik
        : Math.max(0, finalTotal - numPerbaikan - numRusak);

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSave(
        {
          namaBarang: namaBarang.trim(),
          kodeBarang: kodeBarang.trim(),
          kategori,
          lantai,
          ruangan: ruangan.trim() || `Ruang Lantai ${lantai}`,
          jumlah: finalBaik + numPerbaikan + numRusak,
          jumlahBaik: finalBaik,
          jumlahPerbaikan: numPerbaikan,
          jumlahRusak: numRusak,
          satuan,
          kondisi: deriveInventoryCondition(finalBaik, numPerbaikan, numRusak, computedKondisi),
          merkSpesifikasi: merkSpesifikasi.trim(),
          penanggungJawab: penanggungJawab.trim(),
          keterangan: keterangan.trim(),
          fotoUrl,
        },
        editingItem?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan barang inventaris.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewSrc = resolveInventoryPhotoUrl(fotoUrl);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 w-[100vw] max-w-[100vw] min-h-[100vh] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-[3%] sm:p-[2%] animate-backdrop-fade"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-[100%] sm:w-[94%] md:w-[78%] lg:w-[60%] max-w-[100%] bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-800 rounded-[16px] shadow-2xl overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="w-[100%] px-[4%] py-[0.85rem] border-b-[1px] border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-[0.9375rem] sm:text-[1rem] font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Data & Jumlah Barang Inventaris' : 'Tambah Barang Inventaris Kantor'}
              </h3>
              <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400">
                Gedung Kantor DPW Partai NasDem Sulawesi Utara (5 Lantai)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[0.75rem] p-[0.45em] rounded-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-[1rem] h-[1rem]" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="w-[100%] p-[4%] overflow-y-auto space-y-[1rem]">
            {errorMsg && (
              <div className="w-[100%] p-[3%] rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border-[1px] border-rose-200 dark:border-rose-900 text-[0.75rem] text-rose-700 dark:text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            {/* 1. Pilih Lantai Gedung (1 s/d 5) */}
            <div className="w-[100%]">
              <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.4rem]">
                Lokasi Lantai Gedung DPW <span className="text-rose-500">*</span>
              </label>
              <div className="w-[100%] flex flex-wrap items-center justify-between gap-[1.5%]">
                {DPW_FLOORS.map((f) => {
                  const active = lantai === f.lantai;
                  return (
                    <button
                      key={f.lantai}
                      type="button"
                      onClick={() => handleFloorChange(f.lantai)}
                      className={`w-[18.8%] text-[0.75rem] py-[0.65em] px-[0.4em] rounded-[12px] border-[1px] text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-[#1A3282] text-white border-[#1A3282] dark:bg-[#21409A] dark:border-blue-500 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[0.75rem] font-bold block font-mono">
                        Lt. {f.lantai}
                      </span>
                      <span
                        className={`text-[0.625rem] truncate block mt-[0.15rem] ${
                          active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {f.shortTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Nama Barang & Kategori */}
            <div className="w-[100%] flex flex-col sm:flex-row items-start justify-between gap-[2.5%]">
              <div className="w-[100%] sm:w-[58%] mb-[0.75rem] sm:mb-0">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Nama Barang / Aset <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: Meja Kantor Eksekutif / Kursi Rapat"
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                  required
                />
              </div>
              <div className="w-[100%] sm:w-[39.5%]">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Kategori Barang
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                >
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Ruangan Spesifik & Kode Aset */}
            <div className="w-[100%] flex flex-col sm:flex-row items-start justify-between gap-[2.5%]">
              <div className="w-[100%] sm:w-[65%] mb-[0.75rem] sm:mb-0">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Nama Ruangan di Lantai {lantai}
                </label>
                <input
                  type="text"
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  placeholder={`Contoh: ${currentFloorMeta.defaultRooms[0]}`}
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                />
                <div className="w-[100%] flex flex-wrap gap-[0.35rem] mt-[0.4rem]">
                  {currentFloorMeta.defaultRooms.map((rm) => (
                    <button
                      key={rm}
                      type="button"
                      onClick={() => setRuangan(rm)}
                      className={`text-[0.65rem] font-medium px-[0.75em] py-[0.3em] rounded-[8px] border-[1px] cursor-pointer transition-colors ${
                        ruangan === rm
                          ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-900 dark:border-slate-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-[100%] sm:w-[32.5%]">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Kode Aset (Otomatis)
                </label>
                <input
                  type="text"
                  value={kodeBarang}
                  onChange={(e) => setKodeBarang(e.target.value)}
                  placeholder={`INV-L${lantai}-001`}
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] font-mono bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                />
              </div>
            </div>

            {/* 4. Kuantitas & Kondisi Barang (Bisa Diketik Bebas & Stepper +/-) */}
            <div className="w-[100%] p-[3.5%] rounded-[12px] bg-slate-50/80 dark:bg-slate-800/50 border-[1px] border-slate-200/80 dark:border-slate-800 space-y-[0.85rem]">
              {/* Baris Utama: Input Langsung Jumlah Total Barang & Satuan */}
              <div className="w-[100%] flex flex-col sm:flex-row sm:items-center justify-between gap-[0.6rem] pb-[0.75rem] border-b-[1px] border-slate-200/80 dark:border-slate-700/80">
                <div className="w-[100%] sm:w-[45%]">
                  <span className="text-[0.8125rem] font-bold text-slate-900 dark:text-white block">
                    Jumlah Total Barang
                  </span>
                  <span className="text-[0.6875rem] text-slate-500 dark:text-slate-400 block">
                    Ketik langsung angka jumlah stok atau tekan tombol - / +
                  </span>
                </div>

                <div className="w-[100%] sm:w-[52%] flex items-center justify-between sm:justify-end gap-[3%]">
                  <div className="w-[62%] flex items-center rounded-[10px] border-[1px] border-[#1A3282]/40 dark:border-blue-500/40 bg-white dark:bg-slate-900 p-[0.2em]">
                    <button
                      type="button"
                      onClick={() => adjustTotalBy(-1)}
                      className="text-[0.8125rem] px-[0.75em] py-[0.5em] rounded-[8px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Minus className="w-[0.85rem] h-[0.85rem]" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jumlahTotalStr}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      placeholder="0"
                      className="w-[100%] text-center text-[0.9375rem] font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustTotalBy(1)}
                      className="text-[0.8125rem] px-[0.75em] py-[0.5em] rounded-[8px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Plus className="w-[0.85rem] h-[0.85rem]" />
                    </button>
                  </div>

                  <select
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    className="w-[35%] px-[4%] py-[0.55rem] rounded-[10px] text-[0.75rem] font-semibold bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rincian Kondisi (Baik, Perlu Servis, Rusak) */}
              <div className="w-[100%] flex flex-wrap items-center justify-between gap-[2%]">
                <div className="w-[31.5%]">
                  <label className="block text-[0.6875rem] font-medium text-slate-600 dark:text-slate-400 mb-[0.25rem]">
                    Kondisi Baik
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={jumlahBaikStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleBaikChange(e.target.value)}
                    placeholder="0"
                    className="w-[100%] px-[8%] py-[0.45rem] rounded-[10px] text-[0.8125rem] font-mono font-bold bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                  />
                </div>

                <div className="w-[31.5%]">
                  <label className="block text-[0.6875rem] font-medium text-slate-600 dark:text-slate-400 mb-[0.25rem]">
                    Perlu Servis
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={jumlahPerbaikanStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handlePerbaikanChange(e.target.value)}
                    placeholder="0"
                    className="w-[100%] px-[8%] py-[0.45rem] rounded-[10px] text-[0.8125rem] font-mono font-bold bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                  />
                </div>

                <div className="w-[31.5%]">
                  <label className="block text-[0.6875rem] font-medium text-slate-600 dark:text-slate-400 mb-[0.25rem]">
                    Rusak Berat
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={jumlahRusakStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleRusakChange(e.target.value)}
                    placeholder="0"
                    className="w-[100%] px-[8%] py-[0.45rem] rounded-[10px] text-[0.8125rem] font-mono font-bold bg-white dark:bg-slate-900 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                  />
                </div>
              </div>
            </div>

            {/* 5. Spesifikasi & Penanggung Jawab */}
            <div className="w-[100%] flex flex-col sm:flex-row items-start justify-between gap-[2.5%]">
              <div className="w-[100%] sm:w-[48.75%] mb-[0.75rem] sm:mb-0">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Merk / Ukuran / Spesifikasi Singkat
                </label>
                <input
                  type="text"
                  value={merkSpesifikasi}
                  onChange={(e) => setMerkSpesifikasi(e.target.value)}
                  placeholder="Contoh: Kayu Jati 160x80cm / Daikin 2 PK"
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                />
              </div>

              <div className="w-[100%] sm:w-[48.75%]">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Penanggung Jawab / Pemegang Aset
                </label>
                <input
                  type="text"
                  value={penanggungJawab}
                  onChange={(e) => setPenanggungJawab(e.target.value)}
                  placeholder="Contoh: Kepala Sekretariat DPW"
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282]"
                />
              </div>
            </div>

            {/* 6. Input Gambar (Buka Kamera + Upload File) & Catatan */}
            <div className="w-[100%] flex flex-col sm:flex-row items-start justify-between gap-[2.5%]">
              <div className="w-[100%] sm:w-[46%] mb-[0.75rem] sm:mb-0">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Foto Fisik Barang (Kamera / Upload)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {previewSrc ? (
                  <div className="w-[100%] space-y-[0.5rem]">
                    <div className="relative w-[100%] aspect-[16/10] rounded-[12px] border-[1px] border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={previewSrc}
                        alt="Preview Barang"
                        className="w-[100%] h-[100%] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFotoUrl('')}
                        className="absolute top-[5%] right-[4%] text-[0.7rem] p-[0.45em] rounded-[8px] bg-rose-600 text-white shadow-xs cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-[0.85rem] h-[0.85rem]" />
                      </button>
                    </div>
                    <div className="w-[100%] flex items-center justify-between gap-[2%]">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="w-[49%] text-[0.725rem] font-semibold px-[0.8em] py-[0.55em] rounded-[10px] border-[1px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-[0.35rem] cursor-pointer"
                      >
                        <Camera className="w-[0.85rem] h-[0.85rem] text-[#1A3282] dark:text-blue-400" />
                        <span>Foto Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[49%] text-[0.725rem] font-semibold px-[0.8em] py-[0.55em] rounded-[10px] border-[1px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-[0.35rem] cursor-pointer"
                      >
                        <Upload className="w-[0.85rem] h-[0.85rem] text-slate-500" />
                        <span>Ganti File</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-[100%] p-[4%] rounded-[12px] border-[1.5px] border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-[0.6rem]">
                    <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 text-center">
                      Ambil foto langsung dari kamera atau unggah dari galeri perangkat:
                    </p>
                    <div className="w-[100%] flex items-center justify-between gap-[3%]">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="w-[48.5%] text-[0.75rem] font-semibold px-[0.85em] py-[0.7em] rounded-[10px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white flex flex-col items-center justify-center gap-[0.25rem] cursor-pointer shadow-2xs transition-colors"
                      >
                        <Camera className="w-[1rem] h-[1rem]" />
                        <span>Buka Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[48.5%] text-[0.75rem] font-semibold px-[0.85em] py-[0.7em] rounded-[10px] border-[1px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-[0.25rem] cursor-pointer transition-colors"
                      >
                        <Upload className="w-[1rem] h-[1rem] text-slate-500" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-[100%] sm:w-[51.5%]">
                <label className="block text-[0.75rem] font-semibold text-slate-700 dark:text-slate-300 mb-[0.3rem]">
                  Keterangan / Catatan Tambahan
                </label>
                <textarea
                  rows={4}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan kondisi barang, posisi penempatan, atau riwayat pemeliharaan..."
                  className="w-[100%] px-[3.5%] py-[0.55rem] rounded-[12px] text-[0.75rem] bg-white dark:bg-slate-800 border-[1px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#1A3282] resize-none"
                />
              </div>
            </div>

            {/* Footer Submit */}
            <div className="w-[100%] pt-[0.75rem] border-t-[1px] border-slate-200 dark:border-slate-800 flex items-center justify-end gap-[0.5rem]">
              <button
                type="button"
                onClick={onClose}
                className="btn-white text-[0.75rem] font-semibold px-[1.15em] py-[0.6em] rounded-[12px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-[0.35rem] text-[0.75rem] font-semibold px-[1.2em] py-[0.6em] rounded-[12px] border-[1px] border-[#1A3282] bg-[#1A3282] hover:bg-[#21409A] text-white cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              >
                <Check className="w-[0.875rem] h-[0.875rem]" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingItem
                    ? 'Simpan Perubahan'
                    : 'Simpan Barang'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live Camera Modal */}
      <InventoryCameraModal
        isOpen={isCameraOpen}
        title={
          namaBarang
            ? `Foto Barang: ${namaBarang}`
            : `Ambil Foto Barang (Lantai ${lantai})`
        }
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUri) => setFotoUrl(dataUri)}
      />
    </>
  );
};
