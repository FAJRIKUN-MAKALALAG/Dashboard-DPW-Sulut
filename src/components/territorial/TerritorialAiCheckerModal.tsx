import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Building2,
  Building,
  MapPin,
  Users,
  ShieldCheck,
  ArrowUpDown,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { Member } from '../../types';
import { TerritoryContext } from '../../utils/territorialExcelTemplateUtils';
import { getStructureTemplate, PositionSlot } from '../../data/structureTemplates';
import { isJobTitleMatch } from '../../utils/jobMatchingUtils';
import {
  isDpdMatch,
  isDpcMatch,
  isDprtMatch,
  getMemberSubOrgCategory,
  getSlotSubOrgCategory,
} from '../../utils/structureReadinessUtils';

interface TerritorialAiCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  territoryContext: TerritoryContext;
  currentMembers: Member[];
  onSaveMembersBatch: (newMembers: Member[]) => void;
  onSuccessRefresh?: () => void;
}

interface AnalyzedSlotItem {
  slotNo: number;
  subOrg: string;
  jabatan: string;
  isFilled: boolean;
  member?: Member;
  isOrderCorrect: boolean;
  category: 'PIMPINAN' | 'PERTIMBANGAN' | 'PAKAR';
  note?: string;
}

export const TerritorialAiCheckerModal: React.FC<TerritorialAiCheckerModalProps> = ({
  isOpen,
  onClose,
  territoryContext,
  currentMembers,
  onSaveMembersBatch,
  onSuccessRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'filled' | 'vacant' | 'councils'>('all');
  const [isAligning, setIsAligning] = useState(false);
  const [alignSuccessMessage, setAlignSuccessMessage] = useState<string | null>(null);

  // 1. Saring anggota riil yang aktif di wilayah teritorial ini
  const territoryMembers = useMemo(() => {
    return currentMembers.filter((m) => {
      if (territoryContext.level === 'DPW') {
        return (
          m.tingkatKepengurusan === 'DPW' ||
          m.dpd === 'Sulawesi Utara' ||
          m.dpd?.toLowerCase().includes('dpw') ||
          m.wilayahPenugasan === 'DPW' ||
          m.wilayahPenugasan?.includes('DPW') ||
          m.jabatan?.toLowerCase().includes('dpw') ||
          m.jabatan?.toLowerCase().includes('wilayah') ||
          (m.isPengurus && (!m.dpd || m.dpd === 'Sulawesi Utara'))
        );
      }
      if (territoryContext.level === 'DPD') {
        if (!isDpdMatch(m.dpd, territoryContext.dpd)) return false;
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOther =
          m.tingkatKepengurusan !== 'DPC' &&
          m.tingkatKepengurusan !== 'DPRt' &&
          m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPD' ||
          jLower.includes('dpd') ||
          jLower.includes('daerah') ||
          m.dpc === 'Umum (DPD)' ||
          m.dpc === 'Wilayah DPD' ||
          !m.dpc ||
          m.dpc === '-' ||
          (m.isPengurus && isNotOther) ||
          (m.jabatan &&
            m.jabatan !== 'Anggota Biasa' &&
            isNotOther &&
            !jLower.includes('dpc') &&
            !jLower.includes('ranting'))
        );
      }
      if (territoryContext.level === 'DPC') {
        if (!isDpdMatch(m.dpd, territoryContext.dpd) || !isDpcMatch(m.dpc, territoryContext.dpc))
          return false;
        const jLower = (m.jabatan || '').toLowerCase();
        const isNotOther = m.tingkatKepengurusan !== 'DPD' && m.tingkatKepengurusan !== 'DPW';
        return (
          m.tingkatKepengurusan === 'DPC' ||
          jLower.includes('dpc') ||
          jLower.includes('cabang') ||
          (m.isPengurus && m.dpc !== 'Umum (DPD)' && m.dpc !== 'Wilayah DPD' && isNotOther) ||
          (m.jabatan &&
            m.jabatan !== 'Anggota Biasa' &&
            isNotOther &&
            !jLower.includes('dpd') &&
            !jLower.includes('dpw'))
        );
      }
      // DPRt
      if (
        !isDpdMatch(m.dpd, territoryContext.dpd) ||
        !isDpcMatch(m.dpc, territoryContext.dpc) ||
        !isDprtMatch(m.dprt, territoryContext.dprt)
      )
        return false;
      const jLower = (m.jabatan || '').toLowerCase();
      return (
        m.tingkatKepengurusan === 'DPRt' ||
        jLower.includes('dprt') ||
        jLower.includes('ranting') ||
        m.isPengurus
      );
    });
  }, [currentMembers, territoryContext]);

  // 2. Analisis Kepatuhan Format Template & Urutan Slot
  const analysis = useMemo(() => {
    const allSlots = getStructureTemplate(territoryContext.level);
    const pimpinanSlots = allSlots.filter((s) => getSlotSubOrgCategory(s) === 'PIMPINAN');
    const pertimbanganSlots = allSlots.filter((s) => getSlotSubOrgCategory(s) === 'PERTIMBANGAN');
    const pakarSlots = allSlots.filter((s) => getSlotSubOrgCategory(s) === 'PAKAR');

    // Pisahkan anggota riil berdasarkan kategori dewan
    const pimpinanMembers: Member[] = [];
    const pertimbanganMembers: Member[] = [];
    const pakarMembers: Member[] = [];

    territoryMembers.forEach((m) => {
      const cat = getMemberSubOrgCategory(m);
      if (cat === 'PERTIMBANGAN') pertimbanganMembers.push(m);
      else if (cat === 'PAKAR') pakarMembers.push(m);
      else pimpinanMembers.push(m);
    });

    // A. Analisis Dewan Pimpinan (36 Jabatan Baku DPD / DPW / DPC)
    const analyzedPimpinan: AnalyzedSlotItem[] = [];
    const usedMemberNiks = new Set<string>();
    let vacantCount = 0;
    let misalignedCount = 0;

    pimpinanSlots.forEach((slot) => {
      // Cari kader yang jabatannya cocok dengan slot ini
      let matchedMember = pimpinanMembers.find(
        (m) => !usedMemberNiks.has(m.nik) && isJobTitleMatch(m.jabatan, slot.jabatan, slot.subOrg)
      );

      // Fallback: Cocokkan nomor urut jika judul mendekati
      if (!matchedMember) {
        matchedMember = pimpinanMembers.find(
          (m) => !usedMemberNiks.has(m.nik) && m.urutan === slot.no && isJobTitleMatch(m.jabatan, slot.jabatan)
        );
      }

      if (matchedMember) {
        usedMemberNiks.add(matchedMember.nik);
        const isOrderCorrect = matchedMember.urutan === slot.no;
        if (!isOrderCorrect) misalignedCount++;

        analyzedPimpinan.push({
          slotNo: slot.no,
          subOrg: slot.subOrg,
          jabatan: slot.jabatan,
          isFilled: true,
          member: matchedMember,
          isOrderCorrect,
          category: 'PIMPINAN',
          note: isOrderCorrect
            ? `✓ Urutan #${slot.no} sudah presisi`
            : `⚠️ Saat ini urutan #${matchedMember.urutan || '-'}, seharusnya #${slot.no}`,
        });
      } else {
        vacantCount++;
        analyzedPimpinan.push({
          slotNo: slot.no,
          subOrg: slot.subOrg,
          jabatan: slot.jabatan,
          isFilled: false,
          isOrderCorrect: true,
          category: 'PIMPINAN',
          note: `⚠️ Jabatan belum terisi (Slot Kosong #${slot.no})`,
        });
      }
    });

    // Sisa kader pimpinan (lebih dari 36 atau jabatan kustom)
    const extraPimpinan: AnalyzedSlotItem[] = [];
    let extraCounter = pimpinanSlots.length + 1;
    pimpinanMembers.forEach((m) => {
      if (!usedMemberNiks.has(m.nik)) {
        extraPimpinan.push({
          slotNo: extraCounter++,
          subOrg: m.wilayahPenugasan || pimpinanSlots[0]?.subOrg || 'III. DEWAN PIMPINAN DAERAH',
          jabatan: m.jabatan,
          isFilled: true,
          member: m,
          isOrderCorrect: m.urutan === extraCounter - 1,
          category: 'PIMPINAN',
          note: `➕ Jabatan tambahan (di luar ${pimpinanSlots.length} struktur baku)`,
        });
      }
    });

    // B. Analisis Dewan Pertimbangan
    const rankRole = (j?: string): number => {
      const l = (j || '').toLowerCase();
      if (l.startsWith('ketua') && !l.includes('wakil')) return 1;
      if (l.includes('wakil ketua')) return 2;
      if (l.startsWith('sekretaris') && !l.includes('wakil')) return 3;
      if (l.includes('wakil sekretaris')) return 4;
      if (l.includes('bendahara')) return 5;
      return 6;
    };

    const sortedPertimbangan = [...pertimbanganMembers].sort(
      (a, b) => rankRole(a.jabatan) - rankRole(b.jabatan)
    );

    const analyzedPertimbangan: AnalyzedSlotItem[] = sortedPertimbangan.map((m, idx) => ({
      slotNo: idx + 1,
      subOrg: m.wilayahPenugasan || (territoryContext.level === 'DPW' ? 'DEWAN PERTIMBANGAN WILAYAH' : 'I. DEWAN PERTIMBANGAN'),
      jabatan: m.jabatan,
      isFilled: true,
      member: m,
      isOrderCorrect: m.urutan === idx + 1,
      category: 'PERTIMBANGAN',
      note: `🏛️ Dewan Pertimbangan Urutan #${idx + 1}`,
    }));

    // C. Analisis Dewan Pakar
    const sortedPakar = [...pakarMembers].sort(
      (a, b) => rankRole(a.jabatan) - rankRole(b.jabatan)
    );

    const analyzedPakar: AnalyzedSlotItem[] = sortedPakar.map((m, idx) => ({
      slotNo: idx + 1,
      subOrg: m.wilayahPenugasan || (territoryContext.level === 'DPW' ? 'DEWAN PAKAR WILAYAH' : 'II. DEWAN PAKAR'),
      jabatan: m.jabatan,
      isFilled: true,
      member: m,
      isOrderCorrect: m.urutan === idx + 1,
      category: 'PAKAR',
      note: `🎓 Dewan Pakar Urutan #${idx + 1}`,
    }));

    const totalStandardTarget = pimpinanSlots.length;
    const filledStandardCount = totalStandardTarget - vacantCount;
    const completenessPercentage = Math.round((filledStandardCount / totalStandardTarget) * 100);

    return {
      allSlots: [...analyzedPimpinan, ...extraPimpinan, ...analyzedPertimbangan, ...analyzedPakar],
      pimpinanSlots: analyzedPimpinan,
      extraPimpinan,
      analyzedPertimbangan,
      analyzedPakar,
      stats: {
        totalStandardTarget,
        filledStandardCount,
        vacantCount,
        extraCount: extraPimpinan.length,
        misalignedCount,
        pertimbanganCount: analyzedPertimbangan.length,
        pakarCount: analyzedPakar.length,
        totalActiveMembers: territoryMembers.length,
        completenessPercentage,
      },
    };
  }, [territoryMembers, territoryContext]);

  // 3. Eksekusi Penyelarasan Otomatis (Auto-Align Urutan 1..36)
  const handleAutoAlign = async () => {
    setIsAligning(true);
    setAlignSuccessMessage(null);

    try {
      const updatedMembers: Member[] = [];

      // A. Perbarui urutan kader Dewan Pimpinan Baku (1 s/d 36)
      analysis.pimpinanSlots.forEach((item) => {
        if (item.isFilled && item.member) {
          updatedMembers.push({
            ...item.member,
            urutan: item.slotNo,
            terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
            diubahOleh: 'AI Template Aligner (Auto-Align 1..36)',
          });
        }
      });

      // B. Perbarui urutan kader tambahan (> 36)
      analysis.extraPimpinan.forEach((item) => {
        if (item.member) {
          updatedMembers.push({
            ...item.member,
            urutan: item.slotNo,
            terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
            diubahOleh: 'AI Template Aligner (Auto-Align Tambahan)',
          });
        }
      });

      // C. Perbarui urutan Dewan Pertimbangan (1, 2, 3..)
      analysis.analyzedPertimbangan.forEach((item) => {
        if (item.member) {
          updatedMembers.push({
            ...item.member,
            urutan: item.slotNo,
            terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
            diubahOleh: 'AI Template Aligner (Pertimbangan)',
          });
        }
      });

      // D. Perbarui urutan Dewan Pakar (1, 2, 3..)
      analysis.analyzedPakar.forEach((item) => {
        if (item.member) {
          updatedMembers.push({
            ...item.member,
            urutan: item.slotNo,
            terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
            diubahOleh: 'AI Template Aligner (Pakar)',
          });
        }
      });

      onSaveMembersBatch(updatedMembers);

      setAlignSuccessMessage(
        `Sukses! ${updatedMembers.length} susunan pengurus berhasil diselaraskan urutan nomornya sesuai template baku.`
      );

      if (onSuccessRefresh) {
        onSuccessRefresh();
      }

      setTimeout(() => {
        setAlignSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      console.error('Error during auto align:', err);
    } finally {
      setIsAligning(false);
    }
  };

  if (!isOpen) return null;

  // Nama Wilayah untuk Header
  const territoryTitle =
    territoryContext.level === 'DPW'
      ? 'DPW Sulawesi Utara'
      : territoryContext.level === 'DPD'
      ? `DPD ${territoryContext.dpd}`
      : territoryContext.level === 'DPC'
      ? `DPC Kec. ${territoryContext.dpc}`
      : `DPRt Desa/Kel. ${territoryContext.dprt}`;

  // Filter daftar baris tabel sesuai tab aktif
  const filteredList = (() => {
    switch (activeTab) {
      case 'filled':
        return analysis.allSlots.filter((s) => s.isFilled);
      case 'vacant':
        return analysis.pimpinanSlots.filter((s) => !s.isFilled);
      case 'councils':
        return [...analysis.analyzedPertimbangan, ...analysis.analyzedPakar];
      default:
        return analysis.allSlots;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/75 dark:bg-slate-900/75 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  AI Format & Hierarchy Checker
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {territoryTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemeriksaan kepatuhan 36 jabatan baku, deteksi posisi kosong, dan penyelarasan urutan otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Sukses Alert */}
          {alignSuccessMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{alignSuccessMessage}</span>
            </div>
          )}

          {/* Kartu Ringkasan Status Kelengkapan & Urutan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
              <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                Dewan Pimpinan Baku
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-950 dark:text-blue-100">
                  {analysis.stats.filledStandardCount}
                </span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  / {analysis.stats.totalStandardTarget} ({analysis.stats.completenessPercentage}%)
                </span>
              </div>
              <div className="text-[10px] text-blue-700/80 dark:text-blue-400 mt-0.5">
                {analysis.stats.vacantCount === 0
                  ? '✓ Struktur 36 lengkap 100%'
                  : `⚠️ ${analysis.stats.vacantCount} posisi belum terisi`}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Jabatan Kosong
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-950 dark:text-amber-100">
                  {analysis.stats.vacantCount}
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Posisi</span>
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                Ditetapkan kosong pada slot baku
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
              <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                Dewan Khusus
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-purple-950 dark:text-purple-100">
                  {analysis.stats.pertimbanganCount + analysis.stats.pakarCount}
                </span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Kader</span>
              </div>
              <div className="text-[10px] text-purple-700/80 dark:text-purple-400 mt-0.5">
                🏛️ {analysis.stats.pertimbanganCount} Wankar · 🎓 {analysis.stats.pakarCount} Wangan
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Kesehatan Urutan
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                  {analysis.stats.misalignedCount === 0 ? '100%' : `${analysis.stats.misalignedCount}`}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {analysis.stats.misalignedCount === 0 ? 'Presisi' : 'Perlu Diurutkan'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                {analysis.stats.extraCount > 0 ? `+${analysis.stats.extraCount} posisi tambahan` : 'Hierarki sesuai template'}
              </div>
            </div>
          </div>

          {/* Tombol Aksi Penyelarasan Cepat */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <ArrowUpDown className="w-4 h-4 text-amber-300" />
                <span>Penyelarasan Urutan Nomor Template Baku</span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Menyelaraskan nomor urut seluruh pengurus aktif ke nomor slot resmi (1 s/d 36, Dewan Pertimbangan & Pakar) secara permanen.
              </p>
            </div>
            <button
              onClick={handleAutoAlign}
              disabled={isAligning || territoryMembers.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 shadow-md cursor-pointer transition-all disabled:opacity-50 shrink-0"
            >
              {isAligning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Menyelaraskan ke Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Selaraskan Urutan Otomatis</span>
                </>
              )}
            </button>
          </div>

          {/* Tab Filter Navigasi */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 pt-1">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Semua Struktur ({analysis.allSlots.length})
              </button>
              <button
                onClick={() => setActiveTab('filled')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeTab === 'filled'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Terisi ({analysis.stats.totalActiveMembers})
              </button>
              <button
                onClick={() => setActiveTab('vacant')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeTab === 'vacant'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ⚠️ Kosong / Kurang ({analysis.stats.vacantCount})
              </button>
              <button
                onClick={() => setActiveTab('councils')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  activeTab === 'councils'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pertimbangan & Pakar ({analysis.stats.pertimbanganCount + analysis.stats.pakarCount})
              </button>
            </div>
          </div>

          {/* Tabel Rincian Posisi */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-14">No.</th>
                  <th className="py-2.5 px-3">Jabatan & Sub Organisasi</th>
                  <th className="py-2.5 px-3">Nama Pengurus</th>
                  <th className="py-2.5 px-3">NIK</th>
                  <th className="py-2.5 px-3">Status Kepatuhan Template</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada posisi yang sesuai dengan tab ini.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr
                      key={idx}
                      className={
                        !item.isFilled
                          ? 'bg-amber-50/50 dark:bg-amber-950/25 border-l-3 border-amber-500'
                          : item.category === 'PERTIMBANGAN'
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/15'
                          : item.category === 'PAKAR'
                          ? 'bg-purple-50/30 dark:bg-purple-950/15'
                          : 'bg-white dark:bg-slate-900'
                      }
                    >
                      <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-500">
                        {item.slotNo}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <div>
                          <span className={!item.isFilled ? 'font-semibold text-amber-900 dark:text-amber-200' : ''}>
                            {item.jabatan}
                          </span>
                          <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                            {item.subOrg}
                          </span>
                          {item.note && (
                            <span className={`block text-[9.5px] font-mono mt-0.5 ${!item.isFilled ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.note}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {item.isFilled && item.member ? (
                          <span className="font-semibold text-blue-700 dark:text-blue-300">
                            {item.member.namaLengkap}
                          </span>
                        ) : (
                          <span className="italic font-medium text-amber-600 dark:text-amber-400">
                            (Slot Kosong / Belum Terisi)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                        {item.member?.nik || '-'}
                      </td>
                      <td className="py-2 px-3">
                        {!item.isFilled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                            ⚠️ Slot Kosong #{item.slotNo}
                          </span>
                        ) : item.isOrderCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            <Check className="w-3 h-3" /> Urut Slot #{item.slotNo}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                            <ArrowUpDown className="w-3 h-3" /> Urutan #{item.member?.urutan || '-'} ➔ #{item.slotNo}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Pengurus Terdaftar: <strong className="text-slate-800 dark:text-slate-200">{analysis.stats.totalActiveMembers} Kader</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
