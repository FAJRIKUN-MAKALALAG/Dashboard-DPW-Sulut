import React, { useState, useEffect, useMemo } from 'react';
import {
  UserSession,
  Member,
  MyReferralProfile,
  DirectLeaderInfo,
} from '../types';
import { referralService } from '../services/referralService';
import { MemberService } from '../services/memberService';
import { useDebounce } from '../hooks/useDebounce';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import {
  UserCheck,
  IdCard,
  Search,
  Info,
  ShieldCheck,
  UserPlus,
  Camera,
  Globe,
} from 'lucide-react';
import { canAddMembers } from '../utils/permissionUtils';
import { DppEktaRegistrationPanel, isOfficialDppEkta } from '../dpp-ekta';
import {
  PengurusHierarchyCard,
  PengurusRegisterMemberForm,
  PengurusRecruitsList,
  PengurusTerritorySearchTab,
  EditProfileModal,
} from './portal';

interface PengurusPortalPageProps {
  members: Member[];
  session: UserSession;
  onAddMember: (newMember: Member) => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
  onOpenCardModal?: (member: Member) => void;
  onMemberEktaUpdated?: (nik: string, nokta: string) => void;
}

export const PengurusPortalPage: React.FC<PengurusPortalPageProps> = ({
  members,
  session,
  onAddMember,
  onRefreshCloud,
  onOpenCardModal,
  onMemberEktaUpdated,
}) => {
  const isAnggota = session.role === 'ANGGOTA';

  // Mode Tab Internal: 'profil' | 'rekrutmen' (khusus fokus mobile) | 'ekta_dpp' (Pendaftaran e-KTA Pusat) | 'pencarian'
  const [activePortalTab, setActivePortalTab] = useState<'profil' | 'rekrutmen' | 'ekta_dpp' | 'pencarian'>('profil');

  // State profil pengurus aktif
  const [profile, setProfile] = useState<MyReferralProfile | null>(null);
  const [, setLoadingProfile] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);

  // State profil mandiri khusus anggota untuk memastikan foto profil & foto ktp langsung update seketika
  const [selfUpdatedMember, setSelfUpdatedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (isAnggota) {
      MemberService.getMyProfile()
        .then((res) => {
          if (res) {
            setSelfUpdatedMember(res);
          }
        })
        .catch((err) => {
          console.warn('Gagal memuat profil mandiri anggota:', err);
        });
    }
  }, [isAnggota]);

  // Selector untuk Super Admin agar dapat melihat simulasi halaman sebagai pengurus DPRt / DPC / DPD
  const isSuperUser = session.role === 'SUPER_ADMIN';
  const pengurusList = useMemo(() => {
    return members.filter((m) => m.isPengurus);
  }, [members]);

  const [selectedPengurusNik, setSelectedPengurusNik] = useState<string>('');
  const isSuperAdminActingAsSelf = session.role === 'SUPER_ADMIN' && !selectedPengurusNik;

  // Anggota aktif yang sedang ditampilkan
  const activePengurusMember = useMemo(() => {
    if (selfUpdatedMember) {
      if (isAnggota) return selfUpdatedMember;
      if (selectedPengurusNik && selfUpdatedMember.nik === selectedPengurusNik) return selfUpdatedMember;
      if (!selectedPengurusNik && session.adminNik && selfUpdatedMember.nik === session.adminNik) return selfUpdatedMember;
    }
    if (isAnggota) {
      if (session.adminNik) {
        const match = members.find((m) => m.nik === session.adminNik);
        if (match) return match;
      }
      return members[0] || null;
    }
    if (selectedPengurusNik) {
      return members.find((m) => m.nik === selectedPengurusNik) || null;
    }
    // Jika Super Admin sedang dalam mode profil utamanya sendiri (belum memilih simulasi pengurus lain)
    if (session.role === 'SUPER_ADMIN') {
      return null;
    }
    if (session.adminNik) {
      const match = members.find((m) => m.nik === session.adminNik);
      if (match) return match;
    }
    // Jika akun admin tidak memiliki NIK kader atau tidak ditemukan di tabel members,
    // kembalikan null agar halaman tidak keliru menampilkan pengurus lain di urutan pertama (pengurusList[0])
    return null;
  }, [isAnggota, selfUpdatedMember, selectedPengurusNik, session.adminNik, session.role, members]);

  // Load profil referral dari backend (khusus pengurus/admin)
  const loadReferralProfile = async () => {
    if (isAnggota) {
      setLoadingProfile(false);
      return;
    }
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
  }, [selectedPengurusNik, isAnggota]);

  // Menentukan Kode Referral Pengurus (kosong untuk kader biasa tanpa SK)
  const myReferralCode = useMemo(() => {
    if (isAnggota) {
      return '';
    }
    if (isSuperAdminActingAsSelf) {
      return profile?.kodeReferral || 'NSD-DPW-ADMIN';
    }
    if (activePengurusMember?.kodeReferral) {
      return activePengurusMember.kodeReferral;
    }
    if (profile?.kodeReferral) {
      return profile.kodeReferral;
    }
    const tingkat = (
      activePengurusMember?.tingkatKepengurusan ||
      (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW' ? 'DPW' : session.role.replace('ADMIN_', '')) ||
      'DPW'
    ).toUpperCase();
    return `NSD-${tingkat.substring(0, 3)}-${activePengurusMember?.nik ? activePengurusMember.nik.slice(-4) : '0001'}`;
  }, [isAnggota, isSuperAdminActingAsSelf, activePengurusMember, profile, session]);

  // Hierarki Ketua Langsung (Otomatis Tracking Sistem - dinonaktifkan untuk kader biasa)
  const ketuaLangsung: DirectLeaderInfo | null = useMemo(() => {
    if (isAnggota || isSuperAdminActingAsSelf) {
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
    const nama =
      session.adminName ||
      activePengurusMember?.namaLengkap ||
      (isSuperAdminActingAsSelf ? 'Super Admin DPW Sulut' : (profile?.namaLengkap || 'Pengurus'));
    const jabatan =
      session.jabatan ||
      activePengurusMember?.jabatan ||
      (isSuperAdminActingAsSelf
        ? session.jabatan || 'Super Administrator DPW Partai NasDem Sulut'
        : (profile?.jabatan || 'Pengurus'));
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
  }, [myReferralCode, isSuperAdminActingAsSelf, activePengurusMember, profile, session, ketuaLangsung]);

  // Filter rekrutmen saya (Kader yang direkrut oleh pengurus aktif ini)
  const [searchRecruit, setSearchRecruit] = useState<string>('');
  const debouncedSearchRecruit = useDebounce(searchRecruit, 250);
  const myRecruits = useMemo(() => {
    if (isAnggota) return [];
    const currentCode = myReferralCode.toUpperCase();
    const currentNik = activePengurusMember?.nik || session.adminNik;
    const currentName = (activePengurusMember?.namaLengkap || session.adminName || '').toLowerCase();

    return members.filter((m) => {
      if (m.kaderPerekrutKodeReferral && m.kaderPerekrutKodeReferral.toUpperCase() === currentCode) return true;
      if (currentNik && m.kaderPerekrutNik === currentNik) return true;
      if (m.kaderPerekrutNama && m.kaderPerekrutNama.toLowerCase() === currentName) return true;
      return false;
    });
  }, [isAnggota, members, myReferralCode, activePengurusMember, session]);

  const filteredRecruits = useMemo(() => {
    if (isAnggota) return [];
    if (!debouncedSearchRecruit.trim()) return myRecruits;
    const q = debouncedSearchRecruit.toLowerCase();
    return myRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.dpd.toLowerCase().includes(q) ||
        m.dpc.toLowerCase().includes(q)
    );
  }, [isAnggota, myRecruits, debouncedSearchRecruit]);

  // ---------------- PENCARIAN ANGGOTA WILAYAH (BATASAN TINGKAT) ----------------
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const debouncedSearchMemberQuery = useDebounce(searchMemberQuery, 250);
  const [filterMembershipType, setFilterMembershipType] = useState<'ALL' | 'PENGURUS' | 'ANGGOTA'>('ALL');

  // Anggota yang dapat dicari sesuai batasan wilayah pengurus (kosong untuk kader biasa)
  const territoryMembers = useMemo(() => {
    if (isAnggota) return [];
    const userRole = session.role;
    const userDpd = activePengurusMember?.dpd || session.dpdAccess;
    const userDpc = activePengurusMember?.dpc || session.dpcAccess;
    const userDprt = activePengurusMember?.dprt || session.dprtAccess;

    return members.filter((m) => {
      if (userRole === 'ADMIN_DPRT' || activePengurusMember?.tingkatKepengurusan === 'DPRt') {
        if (userDpd && userDpd !== 'ALL' && !isDpdMatch(m.dpd, userDpd)) return false;
        if (userDpc && userDpc !== 'ALL' && !isDpcMatch(m.dpc, userDpc)) return false;
        if (userDprt && userDprt !== 'ALL' && !isDprtMatch(m.dprt, userDprt)) return false;
        return true;
      }

      if (userRole === 'ADMIN_DPC' || activePengurusMember?.tingkatKepengurusan === 'DPC') {
        if (userDpd && userDpd !== 'ALL' && !isDpdMatch(m.dpd, userDpd)) return false;
        if (userDpc && userDpc !== 'ALL' && !isDpcMatch(m.dpc, userDpc)) return false;
        return true;
      }

      if (userRole === 'ADMIN_DPD' || activePengurusMember?.tingkatKepengurusan === 'DPD') {
        if (userDpd && userDpd !== 'ALL' && !isDpdMatch(m.dpd, userDpd)) return false;
        return true;
      }

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

    if (!debouncedSearchMemberQuery.trim()) return result;
    const q = debouncedSearchMemberQuery.toLowerCase();
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
  }, [territoryMembers, debouncedSearchMemberQuery, filterMembershipType]);

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

  const perekrutNama =
    activePengurusMember?.namaLengkap ||
    (isSuperAdminActingAsSelf ? 'Super Admin DPW Sulut' : (profile?.namaLengkap || session.adminName));
  const perekrutJabatan =
    activePengurusMember?.jabatan ||
    (isSuperAdminActingAsSelf
      ? session.jabatan || 'Super Administrator DPW Partai NasDem Sulut'
      : (profile?.jabatan || session.jabatan));
  const perekrutNik = activePengurusMember?.nik || session.adminNik;

  return (
    <div className="space-y-5 animate-in fade-in pb-12 font-sans">
      {/* 1. Header Bar Minimalis (Biru Tua NasDem + Gold Bottom Line) */}
      <div className="bg-gradient-to-r from-[#1A3282] to-[#21409A] dark:from-[#1A3282] dark:to-slate-900 text-white p-4 sm:p-5 md:p-6 rounded-xl border border-slate-800 border-b-2 border-b-[#FDB813] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-blue-100 border border-white/15 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            <UserCheck className="w-3.5 h-3.5 text-[#FFDD00]" />
            <span>{isAnggota ? 'PROFIL KADER RESMI' : 'PORTAL MANDIRI PENGURUS'}</span>
          </div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
            {isAnggota ? 'Profil Saya' : 'Profil Pengurus & Perekrutan'}
          </h1>
          <p className="hidden sm:block text-xs text-slate-300 max-w-3xl leading-relaxed">
            {isAnggota
              ? 'Halaman resmi identitas keanggotaan Anda di Partai NasDem Sulawesi Utara. Lengkapi biodata kontak, wilayah domisili, serta unggah pas foto profil dan berkas secara mandiri.'
              : 'Halaman resmi untuk melihat data kepengurusan Anda, menyalin kode referral, memantau Ketua Langsung pembina wilayah, serta mencari dan mendaftarkan kader baru.'}
          </p>
        </div>
      </div>

      {/* Tabs Menu Portal: HANYA TAMPIL UNTUK PENGURUS BER-SK & ADMIN */}
      {!isAnggota && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full sm:w-fit max-w-full overflow-x-auto">
          {canAddMembers(session) && (
            <button
              type="button"
              onClick={() => setActivePortalTab('rekrutmen')}
              className={`md:hidden flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activePortalTab === 'rekrutmen'
                  ? 'bg-[#1A3282] dark:bg-[#21409A] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Rekrut Kader (Scan KTP)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActivePortalTab('profil')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activePortalTab === 'profil'
                ? 'bg-[#1A3282] dark:bg-[#21409A] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <IdCard className="w-3.5 h-3.5" />
            <span className="md:hidden">Profil &amp; Keanggotaan</span>
            <span className="hidden md:inline">1. Pendaftaran Keanggotaan &amp; Profil</span>
          </button>

          {canAddMembers(session) && (
            <button
              type="button"
              onClick={() => setActivePortalTab('ekta_dpp')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activePortalTab === 'ekta_dpp'
                  ? 'bg-[#1A3282] dark:bg-[#21409A] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#FDB813]" />
              <span>2. Pendaftaran e-KTA Pusat (DPP)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300">
                {territoryMembers.filter((m) => !isOfficialDppEkta(m.nomorEKTA)).length} Belum
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActivePortalTab('pencarian')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              activePortalTab === 'pencarian'
                ? 'bg-[#1A3282] dark:bg-[#21409A] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="md:hidden">Data Wilayah ({territoryMembers.length})</span>
            <span className="hidden md:inline">3. {searchTerritoryTitle} ({territoryMembers.length})</span>
          </button>
        </div>
      )}

      <div key={activePortalTab} className="animate-tab-enter space-y-5">
        {/* ================= TAB KHUSUS MOBILE: FOKUS PENDAFTARAN & SCAN E-KTP ================= */}
        {!isAnggota && activePortalTab === 'rekrutmen' && (
          <div className="space-y-4">
            {canAddMembers(session) && (
              <PengurusRegisterMemberForm
                members={members}
                session={session}
                activePengurusMember={activePengurusMember}
                myReferralCode={myReferralCode}
                ketuaLangsung={ketuaLangsung}
                onAddMember={onAddMember}
                perekrutNama={perekrutNama}
                perekrutJabatan={perekrutJabatan}
                perekrutNik={perekrutNik}
              />
            )}

            <PengurusRecruitsList
              filteredRecruits={filteredRecruits}
              myRecruitsCount={myRecruits.length}
              myReferralCode={myReferralCode}
              searchRecruit={searchRecruit}
              setSearchRecruit={setSearchRecruit}
            />
          </div>
        )}

        {/* ================= TAB 1: PROFIL, REFERRAL & FORM REKRUTMEN ================= */}
        {activePortalTab === 'profil' && (
          <div className="space-y-5">
            {/* Tombol Akses Cepat Pendaftaran di Mode Mobile */}
            {!isAnggota && canAddMembers(session) && (
              <div className="md:hidden p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Rekrut Anggota Baru via Kamera
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                    Scan e-KTP langsung dari HP Anda ({myRecruits.length} kader direkrut)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePortalTab('rekrutmen')}
                  className="px-3.5 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Scan KTP</span>
                </button>
              </div>
            )}

            {session.role === 'SUPER_ADMIN' && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900 dark:text-white mb-0.5">
                      Mode Administrator Sistem (Super Admin)
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400">
                      Akun Anda adalah pengelola teknis sistem se-Sulawesi Utara dengan akses penuh pada seluruh jenjang kepengurusan (DPW, DPD, DPC, dan DPRt).
                    </span>
                  </div>
                </div>
                {pengurusList.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pilih Pengurus:</label>
                    <select
                      value={selectedPengurusNik}
                      onChange={(e) => setSelectedPengurusNik(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 max-w-xs"
                    >
                      <option value="">⭐ Super Admin DPW Sulut (Profil Utama)</option>
                      {pengurusList.map((p) => (
                        <option key={p.nik} value={p.nik}>
                          {p.namaLengkap} ({p.tingkatKepengurusan || 'Pengurus'} - {p.jabatan})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 2. Kartu Identitas Resmi Pengurus & Kode Referral */}
            <PengurusHierarchyCard
              activePengurusMember={activePengurusMember}
              profile={profile}
              session={session}
              ketuaLangsung={ketuaLangsung}
              myReferralCode={myReferralCode}
              copiedCode={copiedCode}
              handleCopy={handleCopy}
              shareText={shareText}
              showQr={showQr}
              setShowQr={setShowQr}
              onOpenEditProfile={activePengurusMember ? () => setIsEditProfileModalOpen(true) : undefined}
              onOpenCardModal={onOpenCardModal}
            />

            {/* 3 & 4. Tablet & Desktop Split: Form Pendaftaran (7 Cols) + Riwayat Rekrutmen (5 Cols) */}
            {!isAnggota && (
              <div className="hidden md:grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-7">
                  {canAddMembers(session) ? (
                    <PengurusRegisterMemberForm
                      members={members}
                      session={session}
                      activePengurusMember={activePengurusMember}
                      myReferralCode={myReferralCode}
                      ketuaLangsung={ketuaLangsung}
                      onAddMember={onAddMember}
                      perekrutNama={perekrutNama}
                      perekrutJabatan={perekrutJabatan}
                      perekrutNik={perekrutNik}
                    />
                  ) : (
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          <span>HAK AKSES PENDAFTARAN ANGGOTA</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Pendaftaran Anggota Baru Dikelola Khusus Pengurus Ber-SK
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                          Sebagai Pengurus tanpa kewenangan pendaftaran mandiri, silakan koordinasikan data kader baru dengan pengurus ber-SK wilayah Anda.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditProfileModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#1A3282] hover:bg-[#21409A] dark:bg-[#21409A] text-white shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        <span>Edit Profil &amp; Berkas Foto</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="xl:col-span-5">
                  <PengurusRecruitsList
                    filteredRecruits={filteredRecruits}
                    myRecruitsCount={myRecruits.length}
                    myReferralCode={myReferralCode}
                    searchRecruit={searchRecruit}
                    setSearchRecruit={setSearchRecruit}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      {/* ================= TAB: PENDAFTARAN E-KTA PUSAT (DPP) - TERPISAH DARI KEANGGOTAAN ================= */}
      {!isAnggota && activePortalTab === 'ekta_dpp' && (
        <DppEktaRegistrationPanel
          members={territoryMembers}
          onMemberEktaUpdated={(nik, nokta) => {
            if (onMemberEktaUpdated) {
              onMemberEktaUpdated(nik, nokta);
            }
            if (onRefreshCloud) {
              onRefreshCloud();
            }
          }}
        />
      )}

      {/* ================= TAB 2: PENCARIAN ANGGOTA WILAYAH (HANYA PENGURUS & ADMIN) ================= */}
      {!isAnggota && activePortalTab === 'pencarian' && (
        <PengurusTerritorySearchTab
          searchTerritoryTitle={searchTerritoryTitle}
          filterMembershipType={filterMembershipType}
          setFilterMembershipType={setFilterMembershipType}
          territoryMembersCount={territoryMembers.length}
          pengurusCount={territoryMembers.filter((m) => m.isPengurus).length}
          anggotaCount={territoryMembers.filter((m) => !m.isPengurus).length}
          searchMemberQuery={searchMemberQuery}
          setSearchMemberQuery={setSearchMemberQuery}
          filteredTerritoryMembers={filteredTerritoryMembers}
        />
      )}
      </div>

      {/* Modal Edit Profil & Unggah Berkas Foto */}
      {activePengurusMember && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          member={activePengurusMember}
          session={session}
          onProfileUpdated={(updatedMember) => {
            setSelfUpdatedMember(updatedMember);
            if (onRefreshCloud) {
              onRefreshCloud();
            }
          }}
        />
      )}
    </div>
  );
};
