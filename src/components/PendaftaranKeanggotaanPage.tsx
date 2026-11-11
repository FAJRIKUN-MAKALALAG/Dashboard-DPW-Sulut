import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Member, UserSession, DirectLeaderInfo } from '../types';
import { PengurusRegisterMemberForm } from './portal/PengurusRegisterMemberForm';

interface PendaftaranKeanggotaanPageProps {
  members: Member[];
  session: UserSession;
  onAddMember: (newMember: Member) => void | Promise<any>;
  onBackToDashboard?: () => void;
  onNavigateToEktaDpp?: () => void;
  onNavigateToMembers?: () => void;
}

export const PendaftaranKeanggotaanPage: React.FC<PendaftaranKeanggotaanPageProps> = ({
  members,
  session,
  onAddMember,
  onBackToDashboard,
  onNavigateToEktaDpp,
  onNavigateToMembers,
}) => {
  // 1. Identifikasi data pengurus yang sedang login
  const activePengurusMember = useMemo(() => {
    if (session.adminNik) {
      const match = members.find((m) => m.nik === session.adminNik);
      if (match) return match;
    }
    return null;
  }, [members, session.adminNik]);

  const isSuperAdmin = session.role === 'SUPER_ADMIN';
  const isSuperAdminActingAsSelf = isSuperAdmin && !activePengurusMember;

  // 2. Kode Referral Perekrut
  const myReferralCode = useMemo(() => {
    if (isSuperAdminActingAsSelf) {
      return 'NSD-DPW-ADMIN';
    }
    if (activePengurusMember?.kodeReferral) {
      return activePengurusMember.kodeReferral;
    }
    const tingkat = (
      activePengurusMember?.tingkatKepengurusan ||
      (session.role === 'ADMIN_DPW' ? 'DPW' : session.role.replace('ADMIN_', '')) ||
      'DPW'
    ).toUpperCase();
    return `NSD-${tingkat.substring(0, 3)}-${activePengurusMember?.nik ? activePengurusMember.nik.slice(-4) : '0001'}`;
  }, [isSuperAdminActingAsSelf, activePengurusMember, session.role]);

  // 3. Hierarki Pembina / Ketua Langsung
  const ketuaLangsung: DirectLeaderInfo | null = useMemo(() => {
    if (isSuperAdminActingAsSelf) return null;
    const tingkat = activePengurusMember?.tingkatKepengurusan || 'DPC';
    const currentJabatan = (activePengurusMember?.jabatan || '').toLowerCase();
    const isCurrentKetua =
      currentJabatan.startsWith('ketua') &&
      !currentJabatan.includes('wakil') &&
      !currentJabatan.includes('sekretaris');

    if (tingkat === 'DPRt') {
      if (!isCurrentKetua) {
        const ketuaDprt = members.find(
          (m) =>
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
      const ketuaDpc = members.find(
        (m) =>
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
        const ketuaDpc = members.find(
          (m) =>
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
      const ketuaDpd = members.find(
        (m) =>
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
    return null;
  }, [isSuperAdminActingAsSelf, activePengurusMember, members]);

  const perekrutNama =
    activePengurusMember?.namaLengkap ||
    (isSuperAdminActingAsSelf ? 'Super Administrator DPW' : session.adminName);
  const perekrutJabatan =
    activePengurusMember?.jabatan ||
    (isSuperAdminActingAsSelf
      ? session.jabatan || 'Super Administrator DPW Sulut'
      : session.jabatan);
  const perekrutNik = activePengurusMember?.nik || session.adminNik;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 animate-page-enter pb-16 font-sans">
      {/* 1. Container Form Utama: Lebar Penuh & Bebas dari Kotak Dialog Popup */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-5 md:p-8">
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
        </div>
      </div>

      {/* 2. Catatan Bantuan Tambahan */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-slate-900/60 border border-blue-200/60 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-[#1A3282] dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Perbedaan Pendaftaran Keanggotaan vs. e-KTA Pusat (DPP):
          </p>
          <p className="leading-relaxed">
            Halaman ini digunakan untuk <strong>Pendaftaran Keanggotaan Teritorial DPW Sulut</strong> (perekrutan kader, input NIK, alamat lengkap, dan riwayat perekrut). 
            Jika Anda ingin menerbitkan <strong>Nomor e-KTA Resmi 16 digit DPP</strong> yang terhubung ke portal pusat digital NasDem, silakan buka menu{' '}
            <button
              type="button"
              onClick={onNavigateToEktaDpp}
              className="text-[#1A3282] dark:text-blue-400 font-bold underline cursor-pointer hover:opacity-80"
            >
              e-KTA Pusat (DPP)
            </button>.
          </p>
        </div>
      </div>
    </div>
  );
};

