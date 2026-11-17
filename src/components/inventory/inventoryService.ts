import { API_BASE_URL } from '../../config/api';
import { apiFetch } from '../../services/http';
import { InventoryCondition, InventoryItem } from './types';

const LEGACY_DUMMY_STORAGE_KEY = 'nasdem_dpw_inventory_v1';
const INVENTORY_STORAGE_KEY = 'nasdem_dpw_inventory_real_v2';

export function resolveInventoryPhotoUrl(fotoUrl?: string | null): string {
  if (!fotoUrl) return '';
  const trimmed = fotoUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const baseRoot = API_BASE_URL.replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/api/')) {
    return `${baseRoot}${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return trimmed;
}

export function loadLocalInventory(): InventoryItem[] {
  try {
    // Bersihkan cache dummy versi lama jika masih ada
    if (localStorage.getItem(LEGACY_DUMMY_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_DUMMY_STORAGE_KEY);
    }
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    /* fallback */
  }
  return [];
}

export function saveLocalInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore storage quota errors */
  }
}

export function deriveInventoryCondition(
  jumlahBaik: number,
  jumlahPerbaikan: number,
  jumlahRusak: number,
  explicit?: InventoryCondition
): InventoryCondition {
  if (jumlahRusak > 0 && jumlahBaik === 0 && jumlahPerbaikan === 0) {
    return 'Rusak';
  }
  if (jumlahPerbaikan > 0 || jumlahRusak > 0) {
    return 'Perlu Perbaikan';
  }
  return explicit || 'Baik';
}

export async function compressImageFileToDataUri(file: File, maxDim = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid'));
      img.onload = () => {
        let { width, height } = img;
        if (Math.max(width, height) > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const remote = await apiFetch<InventoryItem[]>('/inventory');
      if (Array.isArray(remote)) {
        saveLocalInventory(remote);
        return remote;
      }
    } catch {
      /* fallback ke cache lokal */
    }
    return loadLocalInventory();
  },

  async create(payload: Partial<InventoryItem>): Promise<InventoryItem> {
    const lantai = Math.max(1, Math.min(5, Number(payload.lantai) || 1));
    const localItems = loadLocalInventory();
    const floorCount = localItems.filter((i) => i.lantai === lantai).length + 1;

    const jb = Math.max(0, Number(payload.jumlahBaik ?? payload.jumlah ?? 1));
    const jp = Math.max(0, Number(payload.jumlahPerbaikan ?? 0));
    const jr = Math.max(0, Number(payload.jumlahRusak ?? 0));
    const total = jb + jp + jr > 0 ? jb + jp + jr : Math.max(0, Number(payload.jumlah ?? 1));

    const optimisticItem: InventoryItem = {
      id: payload.id || `inv-l${lantai}-${Date.now().toString(36)}`,
      kodeBarang: payload.kodeBarang?.trim() || `INV-L${lantai}-${String(floorCount).padStart(3, '0')}`,
      namaBarang: (payload.namaBarang || 'Barang Inventaris').trim(),
      kategori: payload.kategori || 'Furnitur & Mebel',
      lantai,
      ruangan: (payload.ruangan || `Ruang Lantai ${lantai}`).trim(),
      jumlah: total,
      jumlahBaik: jb + jp + jr > 0 ? jb : total,
      jumlahPerbaikan: jp,
      jumlahRusak: jr,
      satuan: payload.satuan || 'Unit',
      kondisi: deriveInventoryCondition(jb, jp, jr, payload.kondisi),
      merkSpesifikasi: (payload.merkSpesifikasi || '').trim(),
      keterangan: (payload.keterangan || '').trim(),
      penanggungJawab: (payload.penanggungJawab || '').trim(),
      fotoUrl: payload.fotoUrl || '',
      diubahOleh: payload.diubahOleh || 'Admin DPW',
      updatedAt: new Date().toISOString(),
    };

    try {
      const created = await apiFetch<InventoryItem>('/inventory', {
        method: 'POST',
        body: optimisticItem,
      });
      if (created && created.id) {
        const next = [...localItems.filter((i) => i.id !== created.id), created].sort(
          (a, b) => a.lantai - b.lantai || a.kodeBarang.localeCompare(b.kodeBarang)
        );
        saveLocalInventory(next);
        return created;
      }
    } catch {
      /* simpan secara lokal jika offline */
    }

    const next = [...localItems, optimisticItem].sort(
      (a, b) => a.lantai - b.lantai || a.kodeBarang.localeCompare(b.kodeBarang)
    );
    saveLocalInventory(next);
    return optimisticItem;
  },

  async update(id: string, patch: Partial<InventoryItem>): Promise<InventoryItem> {
    const localItems = loadLocalInventory();
    const existing = localItems.find((i) => i.id === id);

    const merged: InventoryItem = existing
      ? { ...existing, ...patch, updatedAt: new Date().toISOString() }
      : ({
          id,
          kodeBarang: patch.kodeBarang || 'INV-L1-001',
          namaBarang: patch.namaBarang || 'Barang Inventaris',
          kategori: patch.kategori || 'Furnitur & Mebel',
          lantai: patch.lantai || 1,
          ruangan: patch.ruangan || 'Ruang Utama',
          jumlah: patch.jumlah ?? 1,
          jumlahBaik: patch.jumlahBaik ?? 1,
          jumlahPerbaikan: patch.jumlahPerbaikan ?? 0,
          jumlahRusak: patch.jumlahRusak ?? 0,
          satuan: patch.satuan || 'Unit',
          kondisi: patch.kondisi || 'Baik',
          merkSpesifikasi: patch.merkSpesifikasi || '',
          keterangan: patch.keterangan || '',
          penanggungJawab: patch.penanggungJawab || '',
          fotoUrl: patch.fotoUrl || '',
          updatedAt: new Date().toISOString(),
        } as InventoryItem);

    if (
      patch.jumlahBaik !== undefined ||
      patch.jumlahPerbaikan !== undefined ||
      patch.jumlahRusak !== undefined
    ) {
      const jb = Math.max(0, Number(merged.jumlahBaik || 0));
      const jp = Math.max(0, Number(merged.jumlahPerbaikan || 0));
      const jr = Math.max(0, Number(merged.jumlahRusak || 0));
      merged.jumlahBaik = jb;
      merged.jumlahPerbaikan = jp;
      merged.jumlahRusak = jr;
      merged.jumlah = jb + jp + jr;
      merged.kondisi = deriveInventoryCondition(jb, jp, jr, patch.kondisi);
    } else if (patch.jumlah !== undefined && existing) {
      const newTotal = Math.max(0, Number(patch.jumlah));
      const diff = newTotal - existing.jumlah;
      merged.jumlah = newTotal;
      merged.jumlahBaik = Math.max(0, existing.jumlahBaik + diff);
      if (merged.jumlahBaik + merged.jumlahPerbaikan + merged.jumlahRusak !== newTotal) {
        merged.jumlahBaik = Math.max(0, newTotal - merged.jumlahPerbaikan - merged.jumlahRusak);
      }
      merged.kondisi = deriveInventoryCondition(
        merged.jumlahBaik,
        merged.jumlahPerbaikan,
        merged.jumlahRusak,
        merged.kondisi
      );
    }

    try {
      const updated = await apiFetch<InventoryItem>(`/inventory/${id}`, {
        method: 'PUT',
        body: merged,
      });
      if (updated && updated.id) {
        const next = localItems
          .map((i) => (i.id === id ? updated : i))
          .sort((a, b) => a.lantai - b.lantai || a.kodeBarang.localeCompare(b.kodeBarang));
        saveLocalInventory(next);
        return updated;
      }
    } catch {
      /* fallback ke penyimpanan lokal */
    }

    const next = localItems
      .map((i) => (i.id === id ? merged : i))
      .sort((a, b) => a.lantai - b.lantai || a.kodeBarang.localeCompare(b.kodeBarang));
    saveLocalInventory(next);
    return merged;
  },

  async remove(id: string): Promise<void> {
    try {
      await apiFetch(`/inventory/${id}`, { method: 'DELETE' });
    } catch {
      /* fallback lokal */
    }
    const localItems = loadLocalInventory();
    saveLocalInventory(localItems.filter((i) => i.id !== id));
  },
};
