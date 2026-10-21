import React, { useState, useEffect, useMemo } from 'react';
import {
  UserSession,
  Member,
  MyReferralProfile,
  DirectLeaderInfo,
} from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { referralService } from '../services/referralService';
import { isLeaderPosition } from '../utils/permissionUtils';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import {
  Sparkles,
  Shield,
  Copy,
  Check,
  Share2,
  QrCode,
  UserPlus,
  Users,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  IdCard,
  FileText,
  Lock,
  ChevronRight,
  Phone,
  UserCheck,
  Filter,
  Info,
} from 'lucide-react';

interface PengurusPortalPageProps {
  members: Member[];
  session: UserSession;
  onAddMember: (newMember: Member) => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
}

export const PengurusPortalPage: React.FC<PengurusPortalPageProps> = ({
  members,
  session,
  onAddMember,
  onRefreshCloud,
  isRefreshingCloud = false,
}) => {
  // Mode Tab Internal: 'profil' (Profil, Referral & Form) | 'pencarian' (Pencarian Anggota Wilayah)
  const [activePortalTab, setActivePortalTab] = useState<'profil' | 'pencarian'>('profil');

  // State profil pengurus aktif
  const [profile, setProfile] = useState<MyReferralProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);

  // Selector untuk Super Admin agar dapat melihat simulasi halaman sebagai pengurus DPRt / DPC / DPD
  const isSuperUser = session.role === 'SUPER_ADMIN';
  const pengurusList = useMemo(() => {
    return members.filter((m) => m.isPengurus);
  }, [members]);

  const [selectedPengurusNik, setSelectedPengurusNik] = useState<string>('');
  const isSuperAdminActingAsSelf = session.role === 'SUPER_ADMIN' && !selectedPengurusNik;

  // Anggota aktif pengurus yang sedang ditampilkan
  const activePengurusMember = useMemo(() => {
    if (selectedPengurusNik) {
      return members.find((m) => m.nik === selectedPengurusNik) || null;
    }
    if (session.adminNik) {
      const match = members.find((m) => m.nik === session.adminNik);
      if (match) return match;
    }
    // Jika Super Admin belum memilih pengurus simulasi
    if (session.role === 'SUPER_ADMIN') {
      return null;
    }
    return pengurusList[0] || null;
  }, [selectedPengurusNik, session.adminNik, session.role, members, pengurusList]);

  // Load profil referral dari backend
  const loadReferralProfile = async () => {
    if (session.role === 'SUPER_ADMIN' && !selectedPengurusNik) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      if (selectedPengurusNik) {
        const res = await referralService.getReferralPreviewByNik(selectedPengurusNik);
        setProfile(res);
      } else {
        const res = await referralService.getMyReferralProfile();
        setProfile(res);
      }
    } catch (err) {
      console.warn('Gagal memuat profil referral via API, menggunakan fallback lokal:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadReferralProfile();
  }, [selectedPengurusNik]);

  // Menentukan Kode Referral Pengurus
  const myReferralCode = useMemo(() => {
    if (activePengurusMember?.kodeReferral) {
      return activePengurusMember.kodeReferral;
    }
    if (profile?.kodeReferral) {
      return profile.kodeReferral;
    }
    const tingkat = (activePengurusMember?.tingkatKepengurusan || session.role.replace('ADMIN_', '') || 'DPD').toUpperCase();
    return `NSD-${tingkat.substring(0, 3)}-${activePengurusMember?.nik ? activePengurusMember.nik.slice(-4) : '0001'}`;
  }, [activePengurusMember, profile, session]);

  // Hierarki Ketua Langsung (Otomatis Tracking Sistem)
  const ketuaLangsung: DirectLeaderInfo | null = useMemo(() => {
    // Super Admin murni (akun administrator atau dev) tidak memiliki dan tidak membutuhkan pimpinan supervisi
    if (isSuperAdminActingAsSelf) {
      return null;
    }

    if (profile?.ketuaLangsung && profile.ketuaLangsung.nama) {
      return profile.ketuaLangsung;
    }
    const tingkat = activePengurusMember?.tingkatKepengurusan || 'DPC';
    const currentJabatan = (activePengurusMember?.jabatan || '').toLowerCase();
    const isCurrentKetua = currentJabatan.startsWith('ketua') && !currentJabatan.includes('wakil') && !currentJabatan.includes('sekretaris');

    if (tingkat === 'DPRt') {
      if (!isCurrentKetua) {
        const ketuaDprt = members.find((m) => 
          m.tingkatKepengurusan === 'DPRt' && 
          m.dpd === activePengurusMember?.dpd && 
          m.dpc === activePengurusMember?.dpc && 
          m.dprt === activePengurusMember?.dprt &&
          (m.jabatan || '').toLowerCase().startsWith('ketua') &&
          !(m.jabatan || '').toLowerCase().includes('wakil')
        );
        if (ketuaDprt) {
          return {
            nik: ketuaDprt.nik,
            nama: ketuaDprt.namaLengkap,
            jabatan: ketuaDprt.jabatan,
            tingkat: 'DPRt',
            kodeReferral: ketuaDprt.kodeReferral || `NSD-DPR-${ketuaDprt.nik.slice(-4)}`,
          };
        }
      }
      const ketuaDpc = members.find((m) => 
        m.tingkatKepengurusan === 'DPC' && 
        m.dpd === activePengurusMember?.dpd && 
        m.dpc === activePengurusMember?.dpc &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpc) {
        return {
          nik: ketuaDpc.nik,
          nama: ketuaDpc.namaLengkap,
          jabatan: ketuaDpc.jabatan,
          tingkat: 'DPC',
          kodeReferral: ketuaDpc.kodeReferral || `NSD-DPC-${ketuaDpc.nik.slice(-4)}`,
        };
      }
    } else if (tingkat === 'DPC') {
      if (!isCurrentKetua) {
        const ketuaDpc = members.find((m) => 
          m.tingkatKepengurusan === 'DPC' && 
          m.dpd === activePengurusMember?.dpd && 
          m.dpc === activePengurusMember?.dpc &&
          (m.jabatan || '').toLowerCase().startsWith('ketua') &&
          !(m.jabatan || '').toLowerCase().includes('wakil')
        );
        if (ketuaDpc) {
          return {
            nik: ketuaDpc.nik,
            nama: ketuaDpc.namaLengkap,
            jabatan: ketuaDpc.jabatan,
            tingkat: 'DPC',
            kodeReferral: ketuaDpc.kodeReferral || `NSD-DPC-${ketuaDpc.nik.slice(-4)}`,
          };
        }
      }
      const ketuaDpd = members.find((m) => 
        m.tingkatKepengurusan === 'DPD' && 
        m.dpd === activePengurusMember?.dpd &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpd) {
        return {
          nik: ketuaDpd.nik,
          nama: ketuaDpd.namaLengkap,
          jabatan: ketuaDpd.jabatan,
          tingkat: 'DPD',
          kodeReferral: ketuaDpd.kodeReferral || `NSD-DPD-${ketuaDpd.nik.slice(-4)}`,
        };
      }
    } else if (tingkat === 'DPD') {
      if (!isCurrentKetua) {
        const ketuaDpd = members.find((m) => 
          m.tingkatKepengurusan === 'DPD' && 
          m.dpd === activePengurusMember?.dpd &&
          (m.jabatan || '').toLowerCase().startsWith('ketua') &&
          !(m.jabatan || '').toLowerCase().includes('wakil')
        );
        if (ketuaDpd) {
          return {
            nik: ketuaDpd.nik,
            nama: ketuaDpd.namaLengkap,
            jabatan: ketuaDpd.jabatan,
            tingkat: 'DPD',
            kodeReferral: ketuaDpd.kodeReferral || `NSD-DPD-${ketuaDpd.nik.slice(-4)}`,
          };
        }
      }
      const ketuaDpw = members.find((m) => 
        m.tingkatKepengurusan === 'DPW' &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpw) {
        return {
          nik: ketuaDpw.nik,
          nama: ketuaDpw.namaLengkap,
          jabatan: ketuaDpw.jabatan,
          tingkat: 'DPW',
          kodeReferral: ketuaDpw.kodeReferral || `NSD-DPW-${ketuaDpw.nik.slice(-4)}`,
        };
      }
    } else if (tingkat === 'DPW' && !isCurrentKetua) {
      const ketuaDpw = members.find((m) => 
        m.tingkatKepengurusan === 'DPW' &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpw) {
        return {
          nik: ketuaDpw.nik,
          nama: ketuaDpw.namaLengkap,
          jabatan: ketuaDpw.jabatan,
          tingkat: 'DPW',
          kodeReferral: ketuaDpw.kodeReferral || `NSD-DPW-${ketuaDpw.nik.slice(-4)}`,
        };
      }
    }

    return {
      nik: '0000000000000000',
      nama: 'Surya Paloh',
      jabatan: 'Ketua Umum DPP Partai NasDem',
      tingkat: 'DPP',
      kodeReferral: 'NSD-DPP-SURYA',
    };
  }, [profile, activePengurusMember, members, isSuperAdminActingAsSelf]);

  // Handler Copy
  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // WhatsApp share message
  const shareText = useMemo(() => {
    const nama = activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName;
    const jabatan = activePengurusMember?.jabatan || profile?.jabatan || session.jabatan;
    const supervisorLine = ketuaLangsung
      ? `🛡️ Supervisi Atasan: ${ketuaLangsung.nama} (${ketuaLangsung.jabatan})\n\n`
      : '\n';
    return encodeURIComponent(
      `Halo! Mari bergabung dalam Gerakan Perubahan bersama PARTAI NASDEM SULAWESI UTARA 💙🧡\n\n` +
      `Saya mengundang Anda untuk mendaftar sebagai kader resmi Partai NasDem melalui jalur kepengurusan saya:\n\n` +
      `👉 KODE REFERRAL SAYA: *${myReferralCode}*\n` +
      `👤 Pengurus Perekrut: ${nama} (${jabatan})\n` +
      supervisorLine +
      `Bersatu, Berjuang, Menang! 🇮🇩`
    );
  }, [myReferralCode, activePengurusMember, profile, session, ketuaLangsung]);

  // ---------------- FORM PENDAFTARAN ANGGOTA BARU ----------------
  const defaultDpd = activePengurusMember?.dpd || (session.dpdAccess !== 'ALL' ? session.dpdAccess : SULUT_REGIONS[0].name);
  const defaultDpc = activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? activePengurusMember.dpc : '';
  const defaultDprt = activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? activePengurusMember.dprt : '';

  const [inputNik, setInputNik] = useState<string>('');
  const [inputEkta, setInputEkta] = useState<string>('');
  const [inputNama, setInputNama] = useState<string>('');
  const [inputHp, setInputHp] = useState<string>('');
  const [inputDpd, setInputDpd] = useState<string>(defaultDpd);
  const [inputDpc, setInputDpc] = useState<string>(defaultDpc);
  const [inputDprt, setInputDprt] = useState<string>(defaultDprt);
  const [inputAlamat, setInputAlamat] = useState<string>('');
  const [inputGender, setInputGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setInputDpd(defaultDpd);
    setInputDpc(defaultDpc);
    setInputDprt(defaultDprt);
  }, [defaultDpd, defaultDpc, defaultDprt]);

  const currentRegion = SULUT_REGIONS.find((r) => r.name === inputDpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  // Filter rekrutmen saya (Kader yang direkrut oleh pengurus aktif ini)
  const [searchRecruit, setSearchRecruit] = useState<string>('');
  const myRecruits = useMemo(() => {
    const currentCode = myReferralCode.toUpperCase();
    const currentNik = activePengurusMember?.nik || session.adminNik;
    const currentName = (activePengurusMember?.namaLengkap || session.adminName || '').toLowerCase();

    return members.filter((m) => {
      if (m.kaderPerekrutKodeReferral && m.kaderPerekrutKodeReferral.toUpperCase() === currentCode) return true;
      if (currentNik && m.kaderPerekrutNik === currentNik) return true;
      if (m.kaderPerekrutNama && m.kaderPerekrutNama.toLowerCase() === currentName) return true;
      return false;
    });
  }, [members, myReferralCode, activePengurusMember, session]);

  const filteredRecruits = useMemo(() => {
    if (!searchRecruit.trim()) return myRecruits;
    const q = searchRecruit.toLowerCase();
    return myRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.dpd.toLowerCase().includes(q) ||
        m.dpc.toLowerCase().includes(q)
    );
  }, [myRecruits, searchRecruit]);

  // Handler Submit Pendaftaran Anggota Baru
  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanNik = inputNik.replace(/[^0-9]/g, '').trim();
    if (cleanNik.length !== 16) {
      setFormError('Nomor NIK KTP wajib 16 digit angka.');
      return;
    }

    if (!inputNama.trim()) {
      setFormError('Nama lengkap calon kader wajib diisi.');
      return;
    }

    const isDuplicate = members.some((m) => m.nik === cleanNik);
    if (isDuplicate) {
      setFormError(`NIK ${cleanNik} sudah terdaftar sebelumnya di database.`);
      return;
    }

    setIsSubmitting(true);

    const perekrutNama = activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName;
    const perekrutJabatan = activePengurusMember?.jabatan || profile?.jabatan || session.jabatan;
    const perekrutNik = activePengurusMember?.nik || session.adminNik;

    const newMember: Member = {
      nik: cleanNik,
      nomorEKTA: inputEkta.trim() || cleanNik,
      namaLengkap: inputNama.trim(),
      nomorHP: inputHp.trim() || '-',
      dpd: inputDpd,
      dpc: inputDpc || 'Umum',
      dprt: inputDprt.trim() || 'Umum',
      alamatLengkap: inputAlamat.trim() || undefined,
      jenisKelamin: inputGender,
      isPengurus: false,
      tingkatKepengurusan: 'Bukan Pengurus',
      jabatan: 'Anggota Biasa',
      status: 'Aktif',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: `Perekrutan mandiri oleh ${perekrutNama} (${perekrutJabatan}) via Portal Pengurus`,
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,

      kaderPerekrutKodeReferral: myReferralCode,
      kaderPerekrutNama: perekrutNama,
      kaderPerekrutJabatan: perekrutJabatan,
      kaderPerekrutNik: perekrutNik,

      ketuaLangsungNik: ketuaLangsung?.nik || undefined,
      ketuaLangsungNama: ketuaLangsung?.nama || undefined,
      ketuaLangsungJabatan: ketuaLangsung?.jabatan || undefined,
      ketuaLangsungTingkat: ketuaLangsung?.tingkat || undefined,
    };

    onAddMember(newMember);

    setIsSubmitting(false);
    setFormSuccess(`Kader ${newMember.namaLengkap} berhasil didaftarkan dan langsung terhubung dengan akun kepengurusan Anda!`);

    setInputNik('');
    setInputEkta('');
    setInputNama('');
    setInputHp('');
    setInputAlamat('');
  };

  // ---------------- PENCARIAN ANGGOTA WILAYAH (BATASAN TINGKAT) ----------------
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [filterMembershipType, setFilterMembershipType] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>('ALL');

  // Anggota yang dapat dicari sesuai batasan wilayah pengurus
  const territoryMembers = useMemo(() => {
    const userRole = session.role;
    const userDpd = activePengurusMember?.dpd || session.dpdAccess;
    const userDpc = activePengurusMember?.dpc || session.dpcAccess;
    const userDprt = activePengurusMember?.dprt || session.dprtAccess;

    return members.filter((m) => {
      // 1. Batasan Pengurus DPRt: Hanya di DPRt-nya sendiri
      if (userRole === 'ADMIN_DPRT' || activePengurusMember?.tingkatKepengurusan === 'DPRt') {
        if (userDpd && userDpd !== 'ALL' && !isDpdMatch(m.dpd, userDpd)) return false;
        if (userDpc && userDpc !== 'ALL' && !isDpcMatch(m.dpc, userDpc)) return false;
        if (userDprt && userDprt !== 'ALL' && !isDprtMatch(m.dprt, userDprt)) return false;
        return true;
      }

      // 2. Batasan Pengurus DPC: Wilayah kecamatannya di tiap-tiap DPRt
      if (userRole === 'ADMIN_DPC' || activePengurusMember?.tingkatKepengurusan === 'DPC') {
        if (userDpd && userDpd !== 'ALL' && !isDpdMatch(m.dpd, userDpd)) return false;
        if (userDpc && userDpc !== 'ALL' && !isDpcMatch(m.dpc, userDpc)) return false;
        return true;
      }

      // 3. Batasan Pengurus DPD: Semua data di wilayah DPD-nya (mencakup semua DPC & DPRt)
      if (userRole === 'ADMIN_DPD' || activePengurusMember?.tingkatKepengurusan === 'DPD') {
        if (userDpd && userDpd !== 'ALL' && !isDpdMatch(m.dpd, userDpd)) return false;
        return true;
      }

      // 4. Pengurus DPW & Super Admin: Semua se-Sulut
      return true;
    });
  }, [members, session, activePengurusMember]);

  const filteredTerritoryMembers = useMemo(() => {
    let result = territoryMembers;

    if (filterMembershipType === 'PENGURUS') {
      result = result.filter((m) => m.isPengurus);
    } else if (filterMembershipType === 'ANGGOTA') {
      result = result.filter((m) => !m.isPengurus);
    }

    if (!searchMemberQuery.trim()) return result;
    const q = searchMemberQuery.toLowerCase();
    return result.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        (m.nomorEKTA && m.nomorEKTA.toLowerCase().includes(q)) ||
        (m.jabatan && m.jabatan.toLowerCase().includes(q)) ||
        (m.nomorHP && m.nomorHP.includes(q)) ||
        m.dpc.toLowerCase().includes(q) ||
        m.dprt.toLowerCase().includes(q)
    );
  }, [territoryMembers, searchMemberQuery, filterMembershipType]);

  // Label Wilayah Pencarian
  const searchTerritoryTitle = useMemo(() => {
    if (session.role === 'ADMIN_DPRT' || activePengurusMember?.tingkatKepengurusan === 'DPRt') {
      return `Pencarian Anggota DPRt (${activePengurusMember?.dprt || session.dprtAccess || 'Desa/Kelurahan'})`;
    }
    if (session.role === 'ADMIN_DPC' || activePengurusMember?.tingkatKepengurusan === 'DPC') {
      return `Pencarian Wilayah DPC Kec. ${activePengurusMember?.dpc || session.dpcAccess || ''} (Semua DPRt)`;
    }
    if (session.role === 'ADMIN_DPD' || activePengurusMember?.tingkatKepengurusan === 'DPD') {
      return `Pencarian Wilayah DPD ${activePengurusMember?.dpd || session.dpdAccess || ''} (Semua DPC & DPRt)`;
    }
    return 'Pencarian Anggota & Pengurus Seluruh Sulawesi Utara';
  }, [session, activePengurusMember]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12 font-sans">
      {/* 1. Header Bar Minimalis: Deep Navy & White (Warna Basic Konsisten Dashboard) */}
      <div className="bg-[#002B49] dark:bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-900/60 text-blue-200 border border-blue-700/60 text-[11px] font-bold tracking-wide">
            <UserCheck className="w-3.5 h-3.5" />
            <span>PORTAL KERJA MANDIRI PENGURUS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Profil Pengurus &amp; Perekrutan Anggota
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Halaman resmi untuk melihat data kepengurusan Anda, menyalin kode referral, memantau Ketua Langsung pembina wilayah, serta mencari dan mendaftarkan kader baru.
          </p>
        </div>

        {/* Super Admin Simulator: Pilih Pengurus untuk Ditampilkan */}
        {isSuperUser && (
          <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shrink-0 w-full md:w-80 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
              <span>Simulasi Pengurus (Super Admin):</span>
            </label>
            <select
              value={selectedPengurusNik}
              onChange={(e) => setSelectedPengurusNik(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Akun Super Admin ({session.adminName}) --</option>
              {pengurusList.slice(0, 100).map((p) => (
                <option key={p.nik} value={p.nik}>
                  [{p.tingkatKepengurusan || 'DPD'}] {p.namaLengkap} - {p.jabatan} ({p.dpd})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs Menu Portal: Profil & Form vs Pencarian Data Wilayah */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActivePortalTab('profil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activePortalTab === 'profil'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>Profil, Referral &amp; Rekrutmen</span>
        </button>

        <button
          onClick={() => setActivePortalTab('pencarian')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activePortalTab === 'pencarian'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{searchTerritoryTitle} ({territoryMembers.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PROFIL, REFERRAL & FORM REKRUTMEN ================= */}
      {activePortalTab === 'profil' && (
        <div className="space-y-6">
          {/* Info Khusus Super Admin jika belum memilih simulasi pengurus */}
          {session.role === 'SUPER_ADMIN' && !selectedPengurusNik && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white mb-0.5">
                  Mode Administrator Sistem (Super Admin)
                </strong>
                <span>
                  Akun Anda adalah pengelola teknis sistem se-Sulawesi Utara dan <strong>tidak terikat pada hierarki supervisi wilayah</strong>. Untuk melihat simulasi tampilan portal pengurus DPRt, DPC, atau DPD beserta pimpinan supervisinya, silakan pilih salah satu pengurus pada dropdown simulasi di atas.
                </span>
              </div>
            </div>
          )}

          {/* 2. Kartu Identitas Resmi Pengurus & Kode Referral (Warna Basic, Non-Flashy) */}
          <div className={`grid grid-cols-1 ${ketuaLangsung ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
            {/* Kolom Kiri: Profil & Status SK */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-blue-700 text-white font-bold text-lg flex items-center justify-center shrink-0">
                    {(activePengurusMember?.namaLengkap || session.adminName || 'ND')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-1">
                      Pengurus {activePengurusMember?.tingkatKepengurusan || session.role.replace('ADMIN_', '')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {activePengurusMember?.jabatan || profile?.jabatan || session.jabatan}
                    </p>
                  </div>
                </div>

                <div className="my-3 border-t border-slate-100 dark:border-slate-800" />

                {/* Info Berkas Identitas & SK */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Nomor NIK KTP</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {activePengurusMember?.nik || session.adminNik || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Nomor E-KTA NasDem</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {activePengurusMember?.nomorEKTA || activePengurusMember?.nik || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Penugasan Wilayah</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[170px] truncate">
                      {activePengurusMember?.dpd || session.dpdAccess}
                      {activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? ` • Kec. ${activePengurusMember.dpc}` : ''}
                      {activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? ` • Desa ${activePengurusMember.dprt}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Nomor SK</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {activePengurusMember?.nomorSK || 'SK-DPW-SULUT-2024'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Keaktifan</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {activePengurusMember?.status || 'Aktif'}
                </span>
              </div>
            </div>

            {/* Kolom Kanan: Dua Kartu (jika ada ketua langsung) ATAU Kartu Registrasi Tunggal (jika Super Admin) */}
            {ketuaLangsung ? (
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* KARTU 1: KODE REFERRAL SAYA */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Kode Referral Resmi Saya</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        UNIK
                      </span>
                    </div>

                    {/* Kotak Kode Referral */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        KODE REKRUTMEN
                      </span>
                      <div className="text-2xl font-black font-mono tracking-widest text-blue-700 dark:text-blue-400">
                        {myReferralCode}
                      </div>
                      <button
                        onClick={() => handleCopy(myReferralCode, 'myCode')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {copiedCode === 'myCode' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Kode</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Bagikan kode ini kepada calon kader baru atau input langsung pada formulir di bawah.
                    </p>
                  </div>

                  {/* Tombol Bagikan WhatsApp & QR */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${shareText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan ke WA</span>
                    </a>

                    <button
                      onClick={() => setShowQr(!showQr)}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showQr ? 'Tutup' : 'QR'}</span>
                    </button>
                  </div>

                  {/* QR Pop-down */}
                  {showQr && (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-900 dark:text-white">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          `NASDEM-REF:${myReferralCode}`
                        )}`}
                        alt="QR Referral"
                        className="w-32 h-32 rounded-lg"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {myReferralCode}
                      </p>
                    </div>
                  )}
                </div>

                {/* KARTU 2: KETUA LANGSUNG & SISTEM ATRIBUSI HIERARKIS */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Ketua Langsung Pembina</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Tingkat {ketuaLangsung.tingkat}
                      </span>
                    </div>

                    {/* Box Info Ketua Langsung */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        PIMPINAN SUPERVISI
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {ketuaLangsung.nama}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {ketuaLangsung.jabatan}
                      </p>

                      {/* Kode Referral Ketua Langsung */}
                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">Kode Ketua:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          <span>{ketuaLangsung.kodeReferral || `NSD-${ketuaLangsung.tingkat}-KETUA`}</span>
                          <button
                            onClick={() => handleCopy(ketuaLangsung.kodeReferral || `NSD-${ketuaLangsung.tingkat}-KETUA`, 'ketuaCode')}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            title="Salin Kode Ketua"
                          >
                            {copiedCode === 'ketuaCode' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Sistem otomatis mengatribusikan koordinasi Anda kepada <strong>{ketuaLangsung.nama}</strong>. Setiap kader baru yang Anda rekrut akan tercatat atas nama Anda sekaligus memperkuat laporan ketua wilayah.
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono text-right pt-2 border-t border-slate-100 dark:border-slate-800">
                    NIK Ketua: {ketuaLangsung.nik}
                  </div>
                </div>
              </div>
            ) : (
              /* Super Admin: Hanya Kartu Kode Registrasi Administrator */
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kode Registrasi Administrator</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ADMIN
                    </span>
                  </div>

                  {/* Kotak Kode Referral */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      KODE REGISTRASI
                    </span>
                    <div className="text-2xl font-black font-mono tracking-widest text-blue-700 dark:text-blue-400">
                      {myReferralCode}
                    </div>
                    <button
                      onClick={() => handleCopy(myReferralCode, 'myCode')}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedCode === 'myCode' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Kode registrasi resmi akun pengelola sistem. Anggota yang didaftarkan melalui kode ini tercatat langsung di bawah pengawasan Administrator Sistem tanpa perantara supervisi atasan.
                  </p>
                </div>

                {/* Tombol Bagikan WhatsApp & QR */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <a
                    href={`https://wa.me/?text=${shareText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan ke WA</span>
                  </a>

                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? 'Tutup' : 'QR'}</span>
                  </button>
                </div>

                {/* QR Pop-down */}
                {showQr && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-900 dark:text-white">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        `NASDEM-REF:${myReferralCode}`
                      )}`}
                      alt="QR Referral"
                      className="w-32 h-32 rounded-lg"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {myReferralCode}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Formulir Cepat Pendaftaran Anggota Baru (Clean & Basic Styling) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pendaftaran Anggota Baru (Jalur Rekrutmen Mandiri)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {ketuaLangsung
                      ? 'Perekrut dan Ketua Langsung otomatis terisi & terkunci ke identitas akun Anda.'
                      : 'Pendaftaran anggota langsung oleh Administrator Sistem.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Kode Perekrut: {myReferralCode}</span>
                </span>
              </div>
            </div>

            {/* Notifikasi Sukses / Error Form */}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. NIK */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor NIK KTP (16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={inputNik}
                    onChange={(e) => setInputNik(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="7105..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {inputNik.length}/16 digit {inputNik.length === 16 ? '✓ Lengkap' : ''}
                  </span>
                </div>

                {/* 2. Nama Lengkap */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Calon Kader <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inputNama}
                    onChange={(e) => setInputNama(e.target.value)}
                    placeholder="Sesuai KTP"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* 3. Nomor WhatsApp / HP */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={inputHp}
                    onChange={(e) => setInputHp(e.target.value)}
                    placeholder="0812..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* 4. Nomor E-KTA */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor E-KTA (Opsional)
                  </label>
                  <input
                    type="text"
                    value={inputEkta}
                    onChange={(e) => setInputEkta(e.target.value)}
                    placeholder="Sama dengan NIK jika kosong"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Wilayah Domisili Calon Anggota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    DPD (Kabupaten / Kota)
                  </label>
                  <select
                    value={inputDpd}
                    onChange={(e) => {
                      setInputDpd(e.target.value);
                      const reg = SULUT_REGIONS.find((r) => r.name === e.target.value);
                      if (reg && reg.subdistricts.length > 0) {
                        setInputDpc(reg.subdistricts[0].name);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    {SULUT_REGIONS.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    DPC (Kecamatan)
                  </label>
                  <select
                    value={inputDpc}
                    onChange={(e) => setInputDpc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    {availableSubdistricts.map((sub) => (
                      <option key={sub.name} value={sub.name}>
                        Kec. {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    DPRt (Kelurahan / Desa)
                  </label>
                  <input
                    type="text"
                    value={inputDprt}
                    onChange={(e) => setInputDprt(e.target.value)}
                    placeholder="Contoh: Ranomeida"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={inputGender}
                    onChange={(e) => setInputGender(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Baris Alamat Lengkap & Tombol Daftarkan */}
              <div className="flex flex-col sm:flex-row items-end gap-3.5">
                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Domisili Lengkap
                  </label>
                  <input
                    type="text"
                    value={inputAlamat}
                    onChange={(e) => setInputAlamat(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, RT/RW..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-60 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Anggota Baru'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 4. Riwayat Anggota Hasil Rekrutmen Pengurus Ini */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Daftar Kader Hasil Rekrutmen Anda ({myRecruits.length} Anggota)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kader resmi Partai NasDem yang terdaftar melalui kode referral Anda ({myReferralCode}).
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchRecruit}
                  onChange={(e) => setSearchRecruit(e.target.value)}
                  placeholder="Cari nama / NIK..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {filteredRecruits.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Anggota yang Terdaftar Melalui Kode Ini
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Gunakan formulir di atas untuk mendaftarkan kader baru atau bagikan kode referral Anda ({myReferralCode}) ke calon kader.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Nama Kader</th>
                      <th className="p-3">NIK &amp; E-KTA</th>
                      <th className="p-3">Wilayah Domisili</th>
                      <th className="p-3">WhatsApp / HP</th>
                      <th className="p-3">Tanggal Daftar</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecruits.map((m) => (
                      <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {m.namaLengkap}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          <div>{m.nik}</div>
                          <div className="text-[10px] text-slate-500">{m.nomorEKTA || '-'}</div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{m.dpd}</div>
                          <div className="text-[10px] text-slate-400">{m.dpc} • {m.dprt}</div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {m.nomorHP || '-'}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {m.tanggalBergabung}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PENCARIAN ANGGOTA WILAYAH (BATASAN TINGKAT) ================= */}
      {activePortalTab === 'pencarian' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>{searchTerritoryTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencarian data anggota dan pengurus dengan hak akses teritorial wilayah Anda.
              </p>
            </div>

            {/* Filter Jenis: Semua / Pengurus / Anggota Biasa */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterMembershipType('ALL')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterMembershipType === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({territoryMembers.length})
              </button>
              <button
                onClick={() => setFilterMembershipType('PENGURUS')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterMembershipType === 'PENGURUS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pengurus ({territoryMembers.filter((m) => m.isPengurus).length})
              </button>
              <button
                onClick={() => setFilterMembershipType('ANGGOTA')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterMembershipType === 'ANGGOTA'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Anggota ({territoryMembers.filter((m) => !m.isPengurus).length})
              </button>
            </div>
          </div>

          {/* Kolom Pencarian Cepat */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchMemberQuery}
              onChange={(e) => setSearchMemberQuery(e.target.value)}
              placeholder="Cari berdasarkan nama lengkap, NIK, e-KTA, jabatan, nomor HP, kecamatan atau kelurahan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Tabel Hasil Pencarian */}
          {filteredTerritoryMembers.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak Ada Data yang Cocok dengan Kata Kunci
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Silakan coba ubah kata kunci pencarian nama, NIK, atau jenis keanggotaan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">NIK &amp; E-KTA</th>
                    <th className="p-3">Jabatan &amp; Peran</th>
                    <th className="p-3">Wilayah Teritorial</th>
                    <th className="p-3">WhatsApp / HP</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTerritoryMembers.slice(0, 100).map((m) => (
                    <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div>{m.namaLengkap}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Gabung: {m.tanggalBergabung || '-'}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        <div>{m.nik}</div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400">{m.nomorEKTA || '-'}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.isPengurus
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {m.jabatan || 'Anggota Biasa'}
                        </span>
                        {m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus' && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Tingkat {m.tingkatKepengurusan}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{m.dpd}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.dpc ? `Kec. ${m.dpc}` : '-'} &middot; {m.dprt ? `Desa ${m.dprt}` : '-'}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                        {m.nomorHP || '-'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTerritoryMembers.length > 100 && (
                <div className="p-2.5 text-center text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
                  Menampilkan 100 dari {filteredTerritoryMembers.length} anggota. Gunakan kolom pencarian di atas untuk menyaring nama tertentu.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
