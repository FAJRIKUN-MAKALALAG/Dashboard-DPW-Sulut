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
import { UserCheck } from 'lucide-react';
import {
  getRoleTerritoryLevel,
  isReferralApplicable,
} from '../utils/permissionUtils';
import {
  PengurusHierarchyCard,
  PengurusRecruitsList,
  EditProfileModal,
  ChangePasswordCard,
} from './portal';

interface PengurusPortalPageProps {
  members: Member[];
  session: UserSession;
  onAddMember: (newMember: Member) => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
  onOpenCardModal?: (member: Member) => void;
  onMemberEktaUpdated?: (nik: string, nokta: string) => void;
  onNavigateToEktaDpp?: () => void;
  onNavigateToPendaftaran?: () => void;
  onSessionUpdated?: (session: UserSession) => void;
}

export const PengurusPortalPage: React.FC<PengurusPortalPageProps> = ({
  members,
  session,
  onRefreshCloud,
  onOpenCardModal,
  onSessionUpdated,
}) => {
  const isAnggota = session.role === 'ANGGOTA';
  const showReferralAndRecruits =
    session.role === 'SUPER_ADMIN' || isReferralApplicable(session);

  const [profile, setProfile] = useState<MyReferralProfile | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);

  // Profil mandiri dari server agar pembaruan kontak/foto langsung terlihat
  const [selfUpdatedMember, setSelfUpdatedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!session.adminNik && !isAnggota) return;
    MemberService.getMyProfile()
      .then((res) => {
        if (res) {
          setSelfUpdatedMember(res);
        }
      })
      .catch((err) => {
        if (isAnggota) {
          console.warn('Gagal memuat profil mandiri anggota:', err);
        }
      });
  }, [isAnggota, session.adminNik]);

  // Identitas pemilik akun yang sedang login saja (tanpa simulasi pengurus lain)
  const activePengurusMember = useMemo(() => {
    if (selfUpdatedMember) {
      if (isAnggota) return selfUpdatedMember;
      if (session.adminNik && selfUpdatedMember.nik === session.adminNik) {
        return selfUpdatedMember;
      }
    }
    if (session.adminNik) {
      const match = members.find((m) => m.nik === session.adminNik);
      if (match) return match;
    }
    if (isAnggota) {
      return members[0] || null;
    }
    return null;
  }, [isAnggota, selfUpdatedMember, session.adminNik, members]);

  useEffect(() => {
    if (!showReferralAndRecruits) return;
    referralService
      .getMyReferralProfile()
      .then((res) => setProfile(res))
      .catch((err) => {
        console.warn('Gagal memuat profil referral via API, menggunakan fallback lokal:', err);
      });
  }, [showReferralAndRecruits]);

  const myReferralCode = useMemo(() => {
    if (!showReferralAndRecruits) return '';
    if (session.role === 'SUPER_ADMIN' && !activePengurusMember) {
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
      getRoleTerritoryLevel(session.role) ||
      'DPW'
    ).toUpperCase();
    return `NSD-${tingkat.substring(0, 3)}-${
      activePengurusMember?.nik ? activePengurusMember.nik.slice(-4) : '0001'
    }`;
  }, [showReferralAndRecruits, activePengurusMember, profile, session.role]);

  const ketuaLangsung: DirectLeaderInfo | null = useMemo(() => {
    if (!showReferralAndRecruits || (session.role === 'SUPER_ADMIN' && !activePengurusMember)) {
      return null;
    }

    if (profile?.ketuaLangsung && profile.ketuaLangsung.nama) {
      return profile.ketuaLangsung;
    }
    if (!activePengurusMember) return null;

    const tingkat = activePengurusMember.tingkatKepengurusan || 'DPC';
    const currentJabatan = (activePengurusMember.jabatan || '').toLowerCase();
    const isCurrentKetua =
      currentJabatan.startsWith('ketua') &&
      !currentJabatan.includes('wakil') &&
      !currentJabatan.includes('sekretaris');

    if (tingkat === 'DPRt') {
      if (!isCurrentKetua) {
        const ketuaDprt = members.find(
          (m) =>
            m.tingkatKepengurusan === 'DPRt' &&
            m.dpd === activePengurusMember.dpd &&
            m.dpc === activePengurusMember.dpc &&
            m.dprt === activePengurusMember.dprt &&
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
      const ketuaDpc = members.find(
        (m) =>
          m.tingkatKepengurusan === 'DPC' &&
          m.dpd === activePengurusMember.dpd &&
          m.dpc === activePengurusMember.dpc &&
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
        const ketuaDpc = members.find(
          (m) =>
            m.tingkatKepengurusan === 'DPC' &&
            m.dpd === activePengurusMember.dpd &&
            m.dpc === activePengurusMember.dpc &&
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
      const ketuaDpd = members.find(
        (m) =>
          m.tingkatKepengurusan === 'DPD' &&
          m.dpd === activePengurusMember.dpd &&
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
        const ketuaDpd = members.find(
          (m) =>
            m.tingkatKepengurusan === 'DPD' &&
            m.dpd === activePengurusMember.dpd &&
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
      const ketuaDpw = members.find(
        (m) =>
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
      const ketuaDpw = members.find(
        (m) =>
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
  }, [showReferralAndRecruits, session.role, profile, activePengurusMember, members]);

  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const shareText = useMemo(() => {
    if (!myReferralCode) return '';
    const nama =
      session.adminName ||
      activePengurusMember?.namaLengkap ||
      profile?.namaLengkap ||
      'Pengurus';
    const jabatan =
      session.jabatan ||
      activePengurusMember?.jabatan ||
      profile?.jabatan ||
      'Pengurus';
    const supervisorLine = ketuaLangsung
      ? `Supervisi Atasan: ${ketuaLangsung.nama} (${ketuaLangsung.jabatan})\n\n`
      : '\n';
    return encodeURIComponent(
      `Halo! Mari bergabung dalam Gerakan Perubahan bersama PARTAI NASDEM SULAWESI UTARA\n\n` +
        `Saya mengundang Anda untuk mendaftar sebagai kader resmi Partai NasDem melalui jalur kepengurusan saya:\n\n` +
        `KODE REFERRAL SAYA: *${myReferralCode}*\n` +
        `Pengurus Perekrut: ${nama} (${jabatan})\n` +
        supervisorLine +
        `Bersatu, Berjuang, Menang!`
    );
  }, [myReferralCode, activePengurusMember, profile, session, ketuaLangsung]);

  // Daftar kader hasil rekrutmen sendiri
  const [searchRecruit, setSearchRecruit] = useState<string>('');
  const debouncedSearchRecruit = useDebounce(searchRecruit, 250);
  const myRecruits = useMemo(() => {
    if (!showReferralAndRecruits) return [];
    const currentCode = myReferralCode.toUpperCase();
    const currentNik = activePengurusMember?.nik || session.adminNik;
    const currentName = (
      activePengurusMember?.namaLengkap ||
      session.adminName ||
      ''
    ).toLowerCase();

    return members.filter((m) => {
      if (
        currentCode &&
        m.kaderPerekrutKodeReferral &&
        m.kaderPerekrutKodeReferral.toUpperCase() === currentCode
      ) {
        return true;
      }
      if (currentNik && m.kaderPerekrutNik === currentNik) return true;
      if (
        currentName &&
        m.kaderPerekrutNama &&
        m.kaderPerekrutNama.toLowerCase() === currentName
      ) {
        return true;
      }
      return false;
    });
  }, [showReferralAndRecruits, members, myReferralCode, activePengurusMember, session]);

  const filteredRecruits = useMemo(() => {
    if (!showReferralAndRecruits) return [];
    if (!debouncedSearchRecruit.trim()) return myRecruits;
    const q = debouncedSearchRecruit.toLowerCase();
    return myRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.dpd.toLowerCase().includes(q) ||
        m.dpc.toLowerCase().includes(q)
    );
  }, [showReferralAndRecruits, myRecruits, debouncedSearchRecruit]);

  return (
    <div className="space-y-5 animate-in fade-in pb-12 font-sans">
      {/* 1. Header Minimalis Pemilik Akun */}
      <div className="bg-gradient-to-r from-[#1A3282] to-[#21409A] dark:from-[#1A3282] dark:to-slate-900 text-white p-4 sm:p-5 md:p-6 rounded-xl border border-slate-800 border-b-2 border-b-[#FDB813] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 text-blue-100 border border-white/15 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
            <UserCheck className="w-3.5 h-3.5 text-[#FFDD00]" />
            <span>PROFIL SAYA</span>
          </div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
            Profil Saya
          </h1>
          <p className="hidden sm:block text-xs text-slate-300 max-w-3xl leading-relaxed">
            {isAnggota
              ? 'Identitas resmi keanggotaan Anda di Partai NasDem Sulawesi Utara, pengaturan username login, pembaruan biodata pribadi, dan kata sandi akun.'
              : 'Identitas resmi pemilik akun, pengaturan username login & kata sandi pribadi, kode referral Anda, serta daftar kader hasil rekrutmen Anda.'}
          </p>
        </div>
      </div>

      {/* 2. Identitas Pemilik Akun */}
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
        onOpenEditProfile={
          activePengurusMember ? () => setIsEditProfileModalOpen(true) : undefined
        }
        onOpenCardModal={onOpenCardModal}
      />

      {/* 3. Username Login & Ubah Kata Sandi Pribadi */}
      <ChangePasswordCard session={session} onSessionUpdated={onSessionUpdated} />

      {/* 4. Daftar Kader Hasil Rekrutmen Sendiri */}
      {showReferralAndRecruits && (
        <PengurusRecruitsList
          filteredRecruits={filteredRecruits}
          myRecruitsCount={myRecruits.length}
          myReferralCode={myReferralCode}
          searchRecruit={searchRecruit}
          setSearchRecruit={setSearchRecruit}
        />
      )}

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
