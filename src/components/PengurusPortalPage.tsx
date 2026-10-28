import React, { useState, useEffect, useMemo } from 'react';
import {
  UserSession,
  Member,
  MyReferralProfile,
  DirectLeaderInfo,
} from '../types';
import { referralService } from '../services/referralService';
import { MemberService } from '../services/memberService';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import {
  UserCheck,
  IdCard,
  Search,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { canAddMembers } from '../utils/permissionUtils';
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
}

export const PengurusPortalPage: React.FC<PengurusPortalPageProps> = ({
  members,
  session,
  onAddMember,
  onRefreshCloud,
  onOpenCardModal,
}) => {
  const isAnggota = session.role === 'ANGGOTA';

  // Mode Tab Internal: 'profil' (Profil, Referral & Form) | 'pencarian' (Pencarian Anggota Wilayah)
  const [activePortalTab, setActivePortalTab] = useState<'profil' | 'pencarian'>('profil');

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
    if (isAnggota) {
      if (selfUpdatedMember) return selfUpdatedMember;
      if (session.adminNik) {
        const match = members.find((m) => m.nik === session.adminNik);
        if (match) return match;
      }
      return members[0] || null;
    }
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
    return pengurusList[0] || members[0] || null;
  }, [isAnggota, selfUpdatedMember, selectedPengurusNik, session.adminNik, session.role, members, pengurusList]);

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
    if (activePengurusMember?.kodeReferral) {
      return activePengurusMember.kodeReferral;
    }
    if (profile?.kodeReferral) {
      return profile.kodeReferral;
    }
    const tingkat = (activePengurusMember?.tingkatKepengurusan || session.role.replace('ADMIN_', '') || 'DPD').toUpperCase();
    return `NSD-${tingkat.substring(0, 3)}-${activePengurusMember?.nik ? activePengurusMember.nik.slice(-4) : '0001'}`;
  }, [isAnggota, activePengurusMember, profile, session]);

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

  // Filter rekrutmen saya (Kader yang direkrut oleh pengurus aktif ini)
  const [searchRecruit, setSearchRecruit] = useState<string>('');
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
    if (!searchRecruit.trim()) return myRecruits;
    const q = searchRecruit.toLowerCase();
    return myRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.dpd.toLowerCase().includes(q) ||
        m.dpc.toLowerCase().includes(q)
    );
  }, [isAnggota, myRecruits, searchRecruit]);

  // ---------------- PENCARIAN ANGGOTA WILAYAH (BATASAN TINGKAT) ----------------
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
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

  const perekrutNama = activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName;
  const perekrutJabatan = activePengurusMember?.jabatan || profile?.jabatan || session.jabatan;
  const perekrutNik = activePengurusMember?.nik || session.adminNik;

  return (
    <div className="space-y-6 animate-in fade-in pb-12 font-sans">
      {/* 1. Header Bar Minimalis */}
      <div className="bg-[#002B49] dark:bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-900/60 text-blue-200 border border-blue-700/60 text-[11px] font-bold tracking-wide">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isAnggota ? 'PROFIL KADER RESMI' : 'PORTAL KERJA MANDIRI PENGURUS'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isAnggota ? 'Profil Saya' : 'Profil Pengurus & Perekrutan Anggota'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {isAnggota
              ? 'Halaman resmi identitas keanggotaan Anda di Partai NasDem Sulawesi Utara. Lengkapi biodata kontak, wilayah domisili, serta unggah pas foto profil dan berkas secara mandiri.'
              : 'Halaman resmi untuk melihat data kepengurusan Anda, menyalin kode referral, memantau Ketua Langsung pembina wilayah, serta mencari dan mendaftarkan kader baru.'}
          </p>
        </div>
      </div>

      {/* Tabs Menu Portal: HANYA TAMPIL UNTUK PENGURUS BER-SK & ADMIN (Anggota biasa tidak ada pencarian wilayah) */}
      {!isAnggota && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
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
            type="button"
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
      )}

      <div key={activePortalTab} className="animate-tab-enter space-y-6">
        {/* ================= TAB 1: PROFIL, REFERRAL & FORM REKRUTMEN ================= */}
        {activePortalTab === 'profil' && (
          <div className="space-y-6">
          {session.role === 'SUPER_ADMIN' && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white mb-0.5">
                  Mode Administrator Sistem (Super Admin)
                </strong>
                <span>
                  Akun Anda adalah pengelola teknis sistem se-Sulawesi Utara dengan akses penuh pada seluruh jenjang kepengurusan (DPW, DPD, DPC, dan DPRt).
                </span>
              </div>
            </div>
          )}

          {/* 2. Kartu Identitas Resmi Pengurus & Kode Referral (atau e-KTA untuk Anggota) */}
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
            onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
            onOpenCardModal={onOpenCardModal}
          />

          {/* 3. Formulir Pendaftaran Anggota Baru (HANYA UNTUK PENGURUS BER-SK RESMI) */}
          {!isAnggota && (
            canAddMembers(session) ? (
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
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>HAK AKSES PENDAFTARAN ANGGOTA</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pendaftaran Anggota Baru Dikelola Khusus Pengurus Ber-SK
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                    Sebagai Pengurus tanpa kewenangan pendaftaran mandiri, silakan koordinasikan data kader baru dengan pengurus ber-SK wilayah Anda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <span>Edit Profil &amp; Berkas Foto</span>
                </button>
              </div>
            )
          )}

          {/* 4. Riwayat Anggota Hasil Rekrutmen Pengurus Ini (HANYA UNTUK PENGURUS/ADMIN) */}
          {!isAnggota && (
            <PengurusRecruitsList
              filteredRecruits={filteredRecruits}
              myRecruitsCount={myRecruits.length}
              myReferralCode={myReferralCode}
              searchRecruit={searchRecruit}
              setSearchRecruit={setSearchRecruit}
            />
          )}
        </div>
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
