import React, { useState, useMemo, useEffect } from 'react';
import { Member, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { getStructureTemplate, PositionSlot } from '../data/structureTemplates';
import { isDpdMatch, isDpcMatch, isDprtMatch, getMemberSubOrgCategory, getSlotSubOrgCategory } from '../utils/structureReadinessUtils';
import { matchMemberToSlot, normalizeSubOrgName, isJobTitleMatch, getCouncilRank, getPimpinanRank } from '../utils/jobMatchingUtils';
import * as XLSX from 'xlsx';
import { MatrixTableSheet, GridRowItem } from './matrix';
import {
  downloadTerritorialExcelTemplate,
  downloadAdvisoryOnlyExcelTemplate,
  downloadExpertOnlyExcelTemplate,
  downloadAdvisoryAndExpertExcelTemplate,
  generateUniqueTerritoryNik,
  TerritoryContext,
} from '../utils/territorialExcelTemplateUtils';
import { TerritorialImportExportModal, TerritorialStructurePrintModal } from './territorial';
import {
  Building2,
  Building,
  MapPin,
  Home,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Edit3,
  Save,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

interface TerritorialStructurePageProps {
  level: 'DPW' | 'DPD' | 'DPC' | 'DPRt';
  members: Member[];
  session?: UserSession;
  onSaveMembersBatch: (updatedMembers: Member[]) => void;
  onDeleteMembersBatch?: (niksToDelete: string[], territoryLabel: string) => void;
  initialDpd?: string;
  initialDpc?: string;
  initialDprt?: string;
  onOpenCardModal?: (member: Member) => void;
  onOpenDetailModal?: (member: Member) => void;
  onBackToDashboard?: () => void;
  onRefreshCloud?: () => Promise<void> | void;
  isRefreshingCloud?: boolean;
}

export const TerritorialStructurePage: React.FC<TerritorialStructurePageProps> = ({
  level,
  members,
  session,
  onSaveMembersBatch,
  onDeleteMembersBatch,
  initialDpd,
  initialDpc,
  initialDprt,
  onBackToDashboard,
  onRefreshCloud,
  isRefreshingCloud = false,
}) => {
  const canAccessDpw = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN_DPW';

  // Available regions scoped to session role & territory
  const availableRegions = useMemo(() => {
    if (!session || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') {
      return SULUT_REGIONS;
    }
    if (session.dpdAccess && session.dpdAccess !== 'ALL') {
      const filtered = SULUT_REGIONS.filter((r) => isDpdMatch(r.name, session.dpdAccess));
      return filtered.length > 0 ? filtered : SULUT_REGIONS;
    }
    return SULUT_REGIONS;
  }, [session]);

  // Territory Selector State
  const [selectedDpd, setSelectedDpd] = useState<string>(() => {
    if (session && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW') {
      if (session.dpdAccess && session.dpdAccess !== 'ALL') return session.dpdAccess;
    }
    if (initialDpd && initialDpd !== 'ALL' && initialDpd !== 'Sulawesi Utara') return initialDpd;
    return availableRegions[0]?.name || 'Kabupaten Minahasa Selatan';
  });

  const currentRegion = useMemo(() => {
    return availableRegions.find((r) => isDpdMatch(r.name, selectedDpd)) || availableRegions[0] || SULUT_REGIONS[0];
  }, [availableRegions, selectedDpd]);

  // Subdistricts scoped to session role & territory
  const availableSubdistricts = useMemo(() => {
    const subs = currentRegion?.subdistricts || [];
    if (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') {
      if (session.dpcAccess && session.dpcAccess !== 'ALL') {
        const filtered = subs.filter((s) => isDpcMatch(s.name, session.dpcAccess));
        return filtered.length > 0 ? filtered : subs;
      }
    }
    return subs;
  }, [currentRegion, session]);

  const [selectedDpc, setSelectedDpc] = useState<string>(() => {
    if (session?.role === 'ADMIN_DPC' || session?.role === 'ADMIN_DPRT') {
      if (session.dpcAccess && session.dpcAccess !== 'ALL') return session.dpcAccess;
    }
    if (initialDpc) return initialDpc;
    return availableSubdistricts[0]?.name || currentRegion?.subdistricts[0]?.name || 'TUMPAAN';
  });

  const currentSubdistrict = useMemo(() => {
    return (
      availableSubdistricts.find((s) => isDpcMatch(s.name, selectedDpc)) ||
      availableSubdistricts[0] ||
      currentRegion?.subdistricts[0]
    );
  }, [availableSubdistricts, currentRegion, selectedDpc]);

  // Villages scoped to session role & territory
  const availableVillages = useMemo(() => {
    const vils = currentSubdistrict?.villages || [];
    if (session?.role === 'ADMIN_DPRT') {
      if (session.dprtAccess && session.dprtAccess !== 'ALL') {
        const filtered = vils.filter((v) => isDprtMatch(v, session.dprtAccess));
        return filtered.length > 0 ? filtered : vils;
      }
    }
    return vils;
  }, [currentSubdistrict, session]);

  const [selectedDprt, setSelectedDprt] = useState<string>(() => {
    if (session?.role === 'ADMIN_DPRT') {
      if (session.dprtAccess && session.dprtAccess !== 'ALL') return session.dprtAccess;
    }
    if (initialDprt) return initialDprt;
    return availableVillages[0] || currentSubdistrict?.villages[0] || 'Pusat';
  });

  // Keep territory in sync if initial props change or session territory updates
  useEffect(() => {
    if (session && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW') {
      if (session.dpdAccess && session.dpdAccess !== 'ALL') {
        const matched = availableRegions.find((r) => isDpdMatch(r.name, session.dpdAccess));
        if (matched) setSelectedDpd(matched.name);
      }
      if (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') {
        if (session.dpcAccess && session.dpcAccess !== 'ALL') {
          setSelectedDpc(session.dpcAccess);
        }
      }
      if (session.role === 'ADMIN_DPRT') {
        if (session.dprtAccess && session.dprtAccess !== 'ALL') {
          setSelectedDprt(session.dprtAccess);
        }
      }
    } else {
      if (initialDpd && initialDpd !== 'ALL' && initialDpd !== 'Sulawesi Utara') {
        setSelectedDpd(initialDpd);
      }
      if (initialDpc) {
        setSelectedDpc(initialDpc);
      }
      if (initialDprt) {
        setSelectedDprt(initialDprt);
      }
    }
  }, [initialDpd, initialDpc, initialDprt, session, availableRegions]);

  // Edit Mode & Messages
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modal Import Excel Teritorial
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  // Modal Cetak Dokumen Resmi Susunan Pengurus
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Territory Context untuk Template Excel dan Import
  const territoryContext: TerritoryContext = useMemo(() => ({
    level,
    dpd: level === 'DPW' ? 'Sulawesi Utara' : selectedDpd,
    dpc: level === 'DPC' || level === 'DPRt' ? selectedDpc : (level === 'DPW' ? 'Wilayah DPW' : 'Umum (DPD)'),
    dprt: level === 'DPRt' ? selectedDprt : 'Pusat/Umum',
  }), [level, selectedDpd, selectedDpc, selectedDprt]);

  const handleDownloadTemplateExcel = () => {
    downloadTerritorialExcelTemplate(territoryContext, gridRows);
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'empty'>('all');

  // Matrix rows state
  const [gridRows, setGridRows] = useState<GridRowItem[]>([]);
  // Tracking deleted members (NIKs) to delete from database upon saving
  const [deletedMemberNiks, setDeletedMemberNiks] = useState<string[]>([]);

  // Local storage key for custom deleted template slots per territory
  const territoryKey = useMemo(() => {
    return `nasdem_deleted_slots_${level}_${selectedDpd}_${selectedDpc || ''}_${selectedDprt || ''}`;
  }, [level, selectedDpd, selectedDpc, selectedDprt]);

  // Load deleted slot keys for current territory
  const getStoredDeletedSlotKeys = (): Set<string> => {
    try {
      const saved = localStorage.getItem(territoryKey);
      if (saved) {
        return new Set<string>(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to read deleted slots from localStorage:', e);
    }
    return new Set<string>();
  };

  const saveDeletedSlotKeys = (keys: Set<string>) => {
    try {
      localStorage.setItem(territoryKey, JSON.stringify(Array.from(keys)));
    } catch (e) {
      console.warn('Failed to save deleted slots to localStorage:', e);
    }
  };

  // Helper to get unique slot key for template slots
  const getSlotKey = (subOrg: string, no: number, jabatan: string) => {
    return `${subOrg.trim().toLowerCase()}__${no}__${jabatan.trim().toLowerCase()}`;
  };

  // Build matrix whenever territory changes or members change
  const buildMatrixRows = (currentDeletedKeys?: Set<string>) => {
    const deletedKeys = currentDeletedKeys || getStoredDeletedSlotKeys();
    const template = getStructureTemplate(level);

    // Filter existing members in this territory and level with robust hierarchical detection
    let matchedMembers: Member[] = [];
    if (level === 'DPW') {
      matchedMembers = members.filter(
        (m) =>
          m.tingkatKepengurusan === 'DPW' ||
          m.dpd === 'Sulawesi Utara' ||
          m.dpd?.toLowerCase().includes('dpw') ||
          m.wilayahPenugasan === 'DPW' ||
          m.wilayahPenugasan?.includes('DPW') ||
          m.jabatan?.toLowerCase().includes('dpw') ||
          m.jabatan?.toLowerCase().includes('wilayah') ||
          (m.isPengurus && (!m.dpd || m.dpd === 'Sulawesi Utara'))
      );
    } else if (level === 'DPD') {
      matchedMembers = members.filter((m) => {
        if (!isDpdMatch(m.dpd, selectedDpd)) return false;
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOtherLevel = m.tingkatKepengurusan !== 'DPC' && m.tingkatKepengurusan !== 'DPRt' && m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPD' ||
          jLower.includes('dpd') ||
          jLower.includes('daerah') ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          !m.dpc ||
          m.dpc === '-' ||
          (m.isPengurus && isNotOtherLevel) ||
          (m.jabatan && m.jabatan !== 'Anggota Biasa' && isNotOtherLevel && !jLower.includes('dpc') && !jLower.includes('ranting'))
        );
      });
    } else if (level === 'DPC') {
      matchedMembers = members.filter((m) => {
        if (!isDpdMatch(m.dpd, selectedDpd) || !isDpcMatch(m.dpc, selectedDpc)) return false;
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOtherLevel = m.tingkatKepengurusan !== 'DPD' && m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPC' ||
          jLower.includes('dpc') ||
          jLower.includes('cabang') ||
          (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD' && isNotOtherLevel) ||
          (m.jabatan && m.jabatan !== 'Anggota Biasa' && isNotOtherLevel && !jLower.includes('dpd') && !jLower.includes('dpw'))
        );
      });
    } else if (level === 'DPRt') {
      matchedMembers = members.filter((m) => {
        if (!isDpdMatch(m.dpd, selectedDpd) || !isDpcMatch(m.dpc, selectedDpc) || !isDprtMatch(m.dprt, selectedDprt)) return false;
        const jLower = (m.jabatan || '').toLowerCase();
        return (
          m.tingkatKepengurusan === 'DPRt' ||
          jLower.includes('dprt') ||
          jLower.includes('ranting') ||
          m.isPengurus ||
          (m.jabatan && m.jabatan !== 'Anggota Biasa')
        );
      });
    }

    // Urutan sesuai berkas Excel (anggota tanpa urutan tetap di belakang, urutan relatifnya dipertahankan)
    matchedMembers = [...matchedMembers].sort(
      (a, b) => (a.urutan ?? Number.MAX_SAFE_INTEGER) - (b.urutan ?? Number.MAX_SAFE_INTEGER)
    );

    const assignedMemberNiks = new Set<string>();

    // Saring template yang tidak dihapus secara eksplisit oleh pengguna
    const activeTemplate = template.filter((slot) => {
      const key = getSlotKey(slot.subOrg, slot.no, slot.jabatan);
      return !deletedKeys.has(key);
    });

    // Pisahkan anggota riil berdasarkan kategori sub-organisasi
    const pertimbanganMembers = matchedMembers.filter(
      (m) => getMemberSubOrgCategory(m) === 'PERTIMBANGAN'
    );
    const pakarMembers = matchedMembers.filter(
      (m) => getMemberSubOrgCategory(m) === 'PAKAR'
    );
    const pimpinanMembers = matchedMembers.filter(
      (m) => getMemberSubOrgCategory(m) === 'PIMPINAN'
    );

    // Pisahkan slot template resmi berdasarkan sub-organisasi
    const pertimbanganTemplateSlots = activeTemplate.filter(
      (s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN'
    );
    const pakarTemplateSlots = activeTemplate.filter(
      (s) => getSlotSubOrgCategory(s) === 'PAKAR'
    );
    const pimpinanTemplateSlots = activeTemplate.filter(
      (s) => getSlotSubOrgCategory(s) === 'PIMPINAN'
    );

    // Tentukan label nama resmi sub-organisasi
    const pertimbanganSubOrgName =
      pertimbanganTemplateSlots[0]?.subOrg ||
      (level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN');

    const pakarSubOrgName =
      pakarTemplateSlots[0]?.subOrg ||
      (level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR');

    const pimpinanSubOrgName =
      pimpinanTemplateSlots[0]?.subOrg ||
      (level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : 'DEWAN PIMPINAN RANTING');

    const rows: GridRowItem[] = [];

    // =========================================================================
    // 1. DEWAN PERTIMBANGAN (WANGAN)
    // Fleksibel mengikuti data riil daerah (3, 5, >5 pengurus dsb).
    // Tidak memaksakan slot kosong jika daerah hanya memiliki pengurus riil tertentu.
    // =========================================================================
    if (pertimbanganMembers.length > 0) {
      const sortedPertimbangan = [...pertimbanganMembers].sort(
        (a, b) => getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan)
      );

      sortedPertimbangan.forEach((m, idx) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: idx + 1,
          subOrg: pertimbanganSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pertimbanganTemplateSlots.length > 0) {
      // Jika belum ada data riil diimpor, sediakan slot template kosong siap isi
      pertimbanganTemplateSlots.forEach((slot, idx) => {
        rows.push({
          id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${idx}`,
          no: slot.no,
          subOrg: slot.subOrg,
          jabatan: slot.jabatan,
          namaLengkap: '',
          nik: '',
          nomorEKTA: '',
          email: '',
          nomorHP: '',
          sosmed: '',
          isExisting: false,
        });
      });
    }

    // =========================================================================
    // 2. DEWAN PAKAR (WANKAR)
    // Fleksibel mengikuti data riil daerah (3, 5, >5 pengurus dsb).
    // =========================================================================
    if (pakarMembers.length > 0) {
      const sortedPakar = [...pakarMembers].sort(
        (a, b) => getCouncilRank(a.jabatan) - getCouncilRank(b.jabatan)
      );

      sortedPakar.forEach((m, idx) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: idx + 1,
          subOrg: pakarSubOrgName,
          jabatan: m.jabatan || 'Anggota',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pakarTemplateSlots.length > 0) {
      // Jika belum ada data riil diimpor, sediakan slot template kosong siap isi
      pakarTemplateSlots.forEach((slot, idx) => {
        rows.push({
          id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${idx}`,
          no: slot.no,
          subOrg: slot.subOrg,
          jabatan: slot.jabatan,
          namaLengkap: '',
          nik: '',
          nomorEKTA: '',
          email: '',
          nomorHP: '',
          sosmed: '',
          isExisting: false,
        });
      });
    }

    // =========================================================================
    // 3. DEWAN PIMPINAN (PENGURUS DPD / DPW / DPC / DPRT)
    // Fleksibel mengikuti data riil hasil import (berapapun jumlahnya, misal 20, 36, atau 40).
    // Keduanya (nama dan jabatan asli) ditarik lengkap, dan urutannya tertata rapi
    // dari Ketua -> Para Wakil Ketua -> Sekretaris -> Para Wakil Sekretaris -> Bendahara -> Para Wakil Bendahara -> Lainnya.
    // =========================================================================
    if (pimpinanMembers.length > 0) {
      const sortedPimpinan = [...pimpinanMembers].sort((a, b) => {
        const rankA = getPimpinanRank(a.jabatan, pimpinanTemplateSlots);
        const rankB = getPimpinanRank(b.jabatan, pimpinanTemplateSlots);
        if (rankA !== rankB) return rankA - rankB;
        return (a.urutan ?? 999) - (b.urutan ?? 999);
      });

      sortedPimpinan.forEach((m, idx) => {
        assignedMemberNiks.add(m.nik);
        rows.push({
          id: m.nik,
          no: idx + 1,
          subOrg: pimpinanSubOrgName,
          jabatan: m.jabatan || 'Pengurus',
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      });
    } else if (pimpinanTemplateSlots.length > 0) {
      // Jika belum ada data riil diimpor, sediakan slot template kosong siap isi
      pimpinanTemplateSlots.forEach((slot, idx) => {
        rows.push({
          id: `empty_${slot.subOrg.replace(/[^a-z0-9]/gi, '_')}_${slot.no}_${idx}`,
          no: slot.no,
          subOrg: slot.subOrg,
          jabatan: slot.jabatan,
          namaLengkap: '',
          nik: '',
          nomorEKTA: '',
          email: '',
          nomorHP: '',
          sosmed: '',
          isExisting: false,
        });
      });
    }


    // =========================================================================
    // 4. ANGGOTA EKSTRA/TAMBAHAN (ANTI DATA-LOSS)
    // Setiap pengurus dari database yang belum masuk slot di atas tetap ditampilkan
    // =========================================================================
    matchedMembers.forEach((m) => {
      if (!assignedMemberNiks.has(m.nik)) {
        assignedMemberNiks.add(m.nik);
        const cat = getMemberSubOrgCategory(m);
        const targetSubOrg =
          cat === 'PERTIMBANGAN'
            ? pertimbanganSubOrgName
            : cat === 'PAKAR'
            ? pakarSubOrgName
            : pimpinanSubOrgName;

        rows.push({
          id: m.nik,
          no: rows.filter((r) => r.subOrg === targetSubOrg).length + 1,
          subOrg: targetSubOrg,
          jabatan: m.jabatan,
          namaLengkap: m.namaLengkap,
          nik: m.nik,
          nomorEKTA: m.nomorEKTA || '',
          email: m.email || '',
          nomorHP: m.nomorHP || '',
          sosmed: m.sosmed || '',
          isExisting: true,
          originalNik: m.nik,
        });
      }
    });

    setGridRows(rows);
  };

  useEffect(() => {
    buildMatrixRows();
    setIsEditMode(false);
    setSaveSuccessMsg(null);
    setDeletedMemberNiks([]);
  }, [level, selectedDpd, selectedDpc, selectedDprt, members]);

  // Handle Input Changes
  const handleCellChange = (id: string, field: keyof GridRowItem, value: string) => {
    setGridRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Add new dynamic row
  const handleAddNewRow = (targetSubOrg?: string) => {
    const defaultSubOrg =
      targetSubOrg ||
      (level === 'DPD'
        ? 'III. DEWAN PIMPINAN DAERAH'
        : level === 'DPC'
        ? 'III. DEWAN PIMPINAN CABANG'
        : level === 'DPW'
        ? 'DEWAN PIMPINAN WILAYAH'
        : `DEWAN PIMPINAN ${level}`);

    const newId = `new_row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: GridRowItem = {
      id: newId,
      no: gridRows.filter((r) => r.subOrg === defaultSubOrg).length + 1,
      subOrg: defaultSubOrg,
      jabatan: defaultSubOrg.includes('PERTIMBANGAN')
        ? 'Anggota Dewan Pertimbangan'
        : defaultSubOrg.includes('PAKAR')
        ? 'Anggota Dewan Pakar'
        : 'Pengurus Tambahan Bidang',
      namaLengkap: '',
      nik: '',
      nomorEKTA: '',
      email: '',
      nomorHP: '',
      sosmed: '',
      isExisting: false,
    };
    setGridRows((prev) => [...prev, newRow]);
    setIsEditMode(true);
  };

  // Delete row (works for template slot, custom added row, or existing member)
  // Delete row (removes slot without deleting member record from DB)
  const handleDeleteRow = (id: string) => {
    const targetRow = gridRows.find((r) => r.id === id);
    if (!targetRow) return;

    // 1. Simpan tanda bahwa slot template ini dihapus permanen dari tampilan agar tidak muncul kembali saat reload
    const slotKey = getSlotKey(targetRow.subOrg, targetRow.no, targetRow.jabatan);
    const deletedKeys = getStoredDeletedSlotKeys();
    deletedKeys.add(slotKey);
    saveDeletedSlotKeys(deletedKeys);

    // 2. Hapus baris dari state tabel (data kader di DB tidak dihapus, tetap terjaga)
    setGridRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Hard Delete baris-baris yang dipilih langsung dari database dan matriks
  const handleDeleteSelectedRows = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return;

    const idSet = new Set(selectedIds);
    const niksToDelete: string[] = [];

    gridRows.forEach((r) => {
      if (idSet.has(r.id)) {
        const nikTarget = r.originalNik || (r.nik && !r.id.startsWith('empty_') ? r.nik : '');
        if (nikTarget) {
          niksToDelete.push(nikTarget);
        }
      }
    });

    // Panggil delete batch ke database melalui onDeleteMembersBatch (backend API)
    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      const territoryLabel = level === 'DPW' ? 'DPW Sulawesi Utara' : `${level} ${selectedDpd}`;
      onDeleteMembersBatch(niksToDelete, territoryLabel);
    }

    // Perbarui slot di tampilan (jika template slot, simpan agar dikosongkan/dibersihkan)
    setGridRows((prev) =>
      prev.map((row) => {
        if (!idSet.has(row.id)) return row;
        // Kosongkan nama & data kader pada baris template
        return {
          ...row,
          namaLengkap: '',
          nik: '',
          nomorEKTA: '',
          email: '',
          nomorHP: '',
          sosmed: '',
          isExisting: false,
          originalNik: undefined,
        };
      })
    );

    setSaveSuccessMsg(`Berhasil hard delete ${niksToDelete.length} data pengurus dari database!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Reset/Pulihkan semua slot template bawaan partai yang sempat dihapus
  const handleResetTemplate = () => {
    if (window.confirm(`Pulihkan seluruh susunan jabatan template standar untuk wilayah ${level} ${selectedDpd}?`)) {
      try {
        localStorage.removeItem(territoryKey);
      } catch (e) {
        console.warn(e);
      }
      buildMatrixRows(new Set<string>());
      setSaveSuccessMsg('Template standar berhasil dipulihkan!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Save changes to database (ANTI DATA-LOSS: Data lama tidak akan terhapus / hilang saat tambah atau edit)
  const handleSaveToDatabase = () => {
    const territoryDpd = level === 'DPW' ? 'Sulawesi Utara' : selectedDpd;
    const territoryDpc =
      level === 'DPW'
        ? 'Wilayah DPW'
        : level === 'DPD'
        ? 'Umum (DPD)'
        : selectedDpc;
    const territoryDprt = level === 'DPRt' ? selectedDprt : 'Pusat/Umum';

    const updatedMembersList: Member[] = [];
    const occupiedNiks = new Set<string>(members.map((m) => m.nik));
    const niksToDelete: string[] = [];

    // 1. Tangani anggota yang dikosongkan namanya di slot (Slot dikosongkan)
    // PENTING: Data kader TIDAK DIHAPUS dari sistem, melainkan dialihkan menjadi Anggota Biasa (Basis KTP)
    gridRows.forEach((row) => {
      if (row.originalNik && !row.namaLengkap.trim()) {
        const prevMember = members.find((m) => m.nik === row.originalNik);
        if (prevMember) {
          updatedMembersList.push({
            ...prevMember,
            isPengurus: false,
            jabatan: 'Anggota / Kader',
            wilayahPenugasan: undefined,
            tingkatKepengurusan: undefined,
            terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
            diubahOleh: session?.adminName || 'Admin Matriks Organisasi',
          });
        }
      }
    });

    // 2. Simpan setiap baris yang terisi nama
    gridRows.forEach((row, idx) => {
      const nama = row.namaLengkap.trim();
      if (!nama) return;

      // Pencocokan ketat HANYA berdasarkan NIK asli atau NIK yang diinput
      // JANGAN PERNAH mencocokkan fallback berdasarkan jabatan karena bisa menimpa data anggota lain dengan jabatan serupa!
      const existingMember = members.find(
        (m) =>
          (row.originalNik && m.nik === row.originalNik) ||
          (row.nik && m.nik === row.nik.trim())
      );

      let nikClean = row.nik.replace(/[^0-9]/g, '').trim();
      if (!nikClean || nikClean.length < 10) {
        if (existingMember && existingMember.nik) {
          nikClean = existingMember.nik;
        } else {
          nikClean = generateUniqueTerritoryNik(territoryDpd, row.subOrg, idx + 1, occupiedNiks);
        }
      } else {
        occupiedNiks.add(nikClean);
      }

      // HANYA jika NIK diubah secara eksplisit dari NIK lama (misal update dari placeholder ke NIK KTP riil),
      // tandai NIK lama untuk dibersihkan agar tidak ada duplikasi data
      if (row.originalNik && row.originalNik !== nikClean) {
        niksToDelete.push(row.originalNik);
      }

      const updatedMember: Member = {
        ...(existingMember || {}),
        nik: nikClean,
        nomorEKTA: row.nomorEKTA.trim() || (existingMember?.nomorEKTA || nikClean),
        namaLengkap: nama,
        email: row.email?.trim() || existingMember?.email || undefined,
        nomorHP: row.nomorHP.trim() || existingMember?.nomorHP || '-',
        sosmed: row.sosmed?.trim() || existingMember?.sosmed || undefined,
        dpd: territoryDpd,
        dpc: territoryDpc,
        dprt: territoryDprt,
        isPengurus: true,
        tingkatKepengurusan: level,
        wilayahPenugasan: row.subOrg,
        nomorSK: existingMember?.nomorSK || `SK-${level}-${territoryDpd.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}/${new Date().getFullYear()}`,
        jabatan: row.jabatan.trim() || 'Pengurus',
        status: existingMember?.status || 'Aktif',
        statusKtpVerified: existingMember ? existingMember.statusKtpVerified : true,
        tanggalBergabung:
          existingMember?.tanggalBergabung || new Date().toISOString().substring(0, 10),
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session?.adminName || 'Admin Matriks Organisasi',
      };

      updatedMembersList.push(updatedMember);
    });

    // Jika ada NIK placeholder yang digantikan oleh NIK baru untuk kader yang sama
    if (niksToDelete.length > 0 && onDeleteMembersBatch) {
      onDeleteMembersBatch(niksToDelete, `${level} ${territoryDpd}`);
    }

    onSaveMembersBatch(updatedMembersList);
    setSaveSuccessMsg(
      `Berhasil menyimpan perubahan ${updatedMembersList.length} data pengurus ke database!`
    );
    setIsEditMode(false);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Export to Excel
  const handleExportTemplateExcel = () => {
    const territoryName =
      level === 'DPW'
        ? 'DPW_SULUT'
        : level === 'DPD'
        ? selectedDpd.replace(/\s+/g, '_')
        : level === 'DPC'
        ? `${selectedDpd}_${selectedDpc}`.replace(/\s+/g, '_')
        : `${selectedDpd}_${selectedDpc}_${selectedDprt}`.replace(/\s+/g, '_');

    const exportData = gridRows.map((r, i) => ({
      No: i + 1,
      'Sub Organisasi': r.subOrg,
      'Jabatan Pengurus': r.jabatan,
      'Nama Lengkap (Sesuai KTP)': r.namaLengkap,
      'No. NIK': r.nik,
      'E-KTA NasDem': r.nomorEKTA,
      Email: r.email,
      'No Telepon': r.nomorHP,
      'Sosial Media': r.sosmed,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Susunan Pengurus');
    XLSX.writeFile(wb, `SUSUNAN_PENGURUS_${level}_${territoryName}.xlsx`);
  };



  // Metrics
  const totalRows = gridRows.length;
  const filledCount = gridRows.filter((r) => r.namaLengkap.trim() !== '').length;
  const emptyCount = totalRows - filledCount;
  const completionPercentage = totalRows > 0 ? Math.round((filledCount / totalRows) * 100) : 0;

  // Filtered rows for display
  const displayRows = useMemo(() => {
    return gridRows.filter((r) => {
      // Status filter
      const isFilled = r.namaLengkap.trim() !== '';
      if (statusFilter === 'filled' && !isFilled) return false;
      if (statusFilter === 'empty' && isFilled) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.jabatan.toLowerCase().includes(q) ||
          r.namaLengkap.toLowerCase().includes(q) ||
          r.nik.toLowerCase().includes(q) ||
          r.nomorEKTA.toLowerCase().includes(q) ||
          r.subOrg.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [gridRows, statusFilter, searchQuery]);

  const getOfficialTitle = () => {
    if (level === 'DPW') {
      return {
        line1: 'SUSUNAN PENGURUS DPW PARTAI NASDEM',
        line2: 'PROVINSI SULAWESI UTARA',
      };
    }
    if (level === 'DPD') {
      return {
        line1: 'SUSUNAN PENGURUS DPD PARTAI NASDEM',
        line2: `${selectedDpd.toUpperCase()} PROVINSI SULAWESI UTARA`,
      };
    }
    if (level === 'DPC') {
      return {
        line1: 'SUSUNAN PENGURUS DPC PARTAI NASDEM',
        line2: `KECAMATAN ${selectedDpc.toUpperCase()} - ${selectedDpd.toUpperCase()}`,
      };
    }
    return {
      line1: 'SUSUNAN PENGURUS DPRt PARTAI NASDEM',
      line2: `DESA/KELURAHAN ${selectedDprt.toUpperCase()} - KEC. ${selectedDpc.toUpperCase()}`,
    };
  };

  // Restriksi Akses: Level DPW HANYA untuk Super Admin dan Admin DPW
  if (level === 'DPW' && !canAccessDpw) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-xl mx-auto shadow-sm my-12 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold border border-rose-200 dark:border-rose-800 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Akses Terbatas: Struktur Tingkat DPW
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Susunan Pengurus Tingkat Wilayah (DPW) Provinsi Sulawesi Utara hanya dapat diakses oleh Admin DPW dan Super Administrator.
        </p>
        <div className="mt-4 inline-block px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          Hak Akses Anda: <strong>{session?.jabatan || session?.role}</strong> ({session?.dpdAccess})
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header Banner & Territory Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="btn-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs mb-3 self-start"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Kembali ke Dashboard Utama</span>
          </button>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                {level === 'DPW' && <Building2 className="w-3 h-3 text-blue-600" />}
                {level === 'DPD' && <Building className="w-3 h-3 text-blue-600" />}
                {level === 'DPC' && <MapPin className="w-3 h-3 text-blue-600" />}
                {level === 'DPRt' && <Home className="w-3 h-3 text-blue-600" />}
                <span>STRUKTUR TINGKAT {level}</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Partai NasDem Sulawesi Utara
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {level === 'DPW' && 'Pengurus DPW Sulawesi Utara'}
              {level === 'DPD' && `Pengurus DPD ${selectedDpd}`}
              {level === 'DPC' && `Pengurus DPC Kec. ${selectedDpc}`}
              {level === 'DPRt' && `Pengurus DPRt Desa/Kel. ${selectedDprt}`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {level === 'DPW' && 'Struktur resmi DPW terdiri dari 70 jabatan: Dewan Pertimbangan, Dewan Pakar, dan Dewan Pimpinan Wilayah.'}
              {level === 'DPD' && `Struktur resmi DPD terdiri dari 44 jabatan kuota standar (Dewan Pertimbangan, Dewan Pakar, dan Dewan Pimpinan Daerah).`}
              {level === 'DPC' && `Struktur resmi DPC terdiri dari 25 jabatan kuota standar di wilayah ${selectedDpd}.`}
              {level === 'DPRt' && `Struktur resmi DPRt terdiri dari 9 jabatan inti ranting desa/kelurahan di Kec. ${selectedDpc}.`}
            </p>
          </div>

          {/* Territory Selectors (Clean & Responsive) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {level !== 'DPW' && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih DPD
                  </span>
                  <select
                    value={selectedDpd}
                    disabled={availableRegions.length <= 1}
                    onChange={(e) => {
                      const newDpd = e.target.value;
                      setSelectedDpd(newDpd);
                      const reg = availableRegions.find((r) => r.name === newDpd);
                      if (reg && reg.subdistricts.length > 0) {
                        setSelectedDpc(reg.subdistricts[0].name);
                        setSelectedDprt(reg.subdistricts[0].villages[0] || 'Pusat');
                      }
                    }}
                    className={`bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-1 ${
                      availableRegions.length <= 1 ? 'cursor-default opacity-90' : 'cursor-pointer'
                    }`}
                  >
                    {availableRegions.map((r) => (
                      <option key={r.id} value={r.name} className="dark:bg-slate-900">
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(level === 'DPC' || level === 'DPRt') && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih DPC (Kecamatan)
                  </span>
                  <select
                    value={selectedDpc}
                    disabled={availableSubdistricts.length <= 1}
                    onChange={(e) => {
                      const newDpc = e.target.value;
                      setSelectedDpc(newDpc);
                      const sub = availableSubdistricts.find((s) => s.name === newDpc);
                      if (sub && sub.villages.length > 0) {
                        setSelectedDprt(sub.villages[0]);
                      }
                    }}
                    className={`bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-1 ${
                      availableSubdistricts.length <= 1 ? 'cursor-default opacity-90' : 'cursor-pointer'
                    }`}
                  >
                    {availableSubdistricts.map((s) => (
                      <option key={s.name} value={s.name} className="dark:bg-slate-900">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {level === 'DPRt' && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Home className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih DPRt (Desa/Kel.)
                  </span>
                  <select
                    value={selectedDprt}
                    disabled={availableVillages.length <= 1}
                    onChange={(e) => setSelectedDprt(e.target.value)}
                    className={`bg-transparent font-bold text-xs text-slate-900 dark:text-white focus:outline-none pr-1 ${
                      availableVillages.length <= 1 ? 'cursor-default opacity-90' : 'cursor-pointer'
                    }`}
                  >
                    {availableVillages.map((v) => (
                      <option key={v} value={v} className="dark:bg-slate-900">
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Progress & Metrics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Tingkat Keterisian
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {completionPercentage}%
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    completionPercentage >= 100
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {completionPercentage >= 100 ? 'Lengkap' : 'Belum Lengkap'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jabatan Terisi
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {filledCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  dari {totalRows} posisi kuota
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Jabatan Kosong / Tersisa
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {emptyCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {emptyCount === 0 ? 'Semua posisi terisi' : 'perlu diisi kader'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              completionPercentage >= 100
                ? 'bg-emerald-500'
                : completionPercentage >= 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(2, Math.min(completionPercentage, 100))}%` }}
          />
        </div>
      </div>

      {/* 3. Interactive Toolbar & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengurus, jabatan, NIK, atau no KTA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Semua ({totalRows})
            </button>
            <button
              onClick={() => setStatusFilter('filled')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                statusFilter === 'filled'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Terisi ({filledCount})
            </button>
            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                statusFilter === 'empty'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Kosong ({emptyCount})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {isEditMode ? (
            <>
              <button
                onClick={() => handleAddNewRow()}
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer text-blue-600 dark:text-blue-400"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Baris</span>
              </button>
              <button
                onClick={handleSaveToDatabase}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
              <button
                onClick={handleResetTemplate}
                title="Pulihkan seluruh kolom/baris susunan pengurus ke template bawaan standar partai"
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-400 hover:border-amber-400 cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Reset Template</span>
              </button>
              <button
                onClick={() => {
                  buildMatrixRows();
                  setIsEditMode(false);
                }}
                className="btn-white px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Mode Edit</span>
            </button>
          )}

          <button
            onClick={handleDownloadTemplateExcel}
            title={`Download Template Input Excel Lengkap Khusus ${level} (Daftar Seluruh Jabatan Resmi)`}
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Template Lengkap</span>
          </button>

          {(level === 'DPW' || level === 'DPD') && (
            <>
              <button
                onClick={() => downloadAdvisoryOnlyExcelTemplate(territoryContext, gridRows)}
                title="Download Template MURNI Khusus Dewan Pertimbangan (Ketua, Wakil, Sekretaris, Anggota urut rapi tanpa tercampur)"
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 dark:text-amber-300 hover:border-amber-400 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="text-amber-600 dark:text-amber-400">🏛️</span>
                <span>Template Pertimbangan</span>
              </button>

              <button
                onClick={() => downloadExpertOnlyExcelTemplate(territoryContext, gridRows)}
                title="Download Template MURNI Khusus Dewan Pakar (Ketua, Wakil, Sekretaris, Anggota urut rapi tanpa tercampur)"
                className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="text-emerald-600 dark:text-emerald-400">🎓</span>
                <span>Template Pakar</span>
              </button>
            </>
          )}

          {onRefreshCloud && (
            <button
              onClick={onRefreshCloud}
              disabled={isRefreshingCloud}
              title="Tarik & sinkronkan ulang seluruh data susunan pengurus langsung dari Supabase live"
              className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
              <span>{isRefreshingCloud ? 'Menarik...' : 'Tarik Data Supabase'}</span>
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import Susunan Pengurus dari Excel (Pra-tinjau & Validasi Otomatis)"
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-700 dark:text-blue-300 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            title="Cetak Berkas Susunan Pengurus Resmi (Format Cetak / PDF dengan Kop Surat & Logo Resmi)"
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-800 dark:text-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleExportTemplateExcel}
            title="Export Data Susunan Pengurus Saat Ini (.xlsx)"
            className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Ekspor Data</span>
          </button>
        </div>
      </div>

      {/* 4. Matrix Tables Rendering */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <MatrixTableSheet
          gridRows={displayRows}
          isEditMode={isEditMode}
          officialTitle={getOfficialTitle()}
          onCellChange={handleCellChange}
          onDeleteRow={handleDeleteRow}
          onDeleteSelectedRows={handleDeleteSelectedRows}
          onAddNewRowForSubOrg={handleAddNewRow}
        />
      </div>

      {/* 5. Modal Import / Export Excel Teritorial Khusus */}
      <TerritorialImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        territoryContext={territoryContext}
        currentRows={gridRows}
        currentMembers={members}
        session={session}
        onSaveMembersBatch={onSaveMembersBatch}
        onDeleteMembersBatch={onDeleteMembersBatch}
        onSuccessRefresh={() => {
          buildMatrixRows();
        }}
      />

      {/* 6. Modal Cetak Dokumen Resmi Susunan Pengurus */}
      <TerritorialStructurePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        level={level}
        dpd={selectedDpd}
        dpc={selectedDpc}
        dprt={selectedDprt}
        gridRows={gridRows}
        session={session}
      />
    </div>
  );
};
export default TerritorialStructurePage;
