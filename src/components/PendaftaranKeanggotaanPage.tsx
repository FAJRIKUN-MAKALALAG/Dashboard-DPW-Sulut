import React, { useMemo } from 'react';
import {
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Globe,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';
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
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-page-enter pb-16 font-sans">
      {/* 1. Header Banner Bersih & Selaras Tema NasDem */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3282] via-[#21409A] to-[#1A3282] text-white p-4 sm:p-6 shadow-sm border border-blue-900 border-b-2 border-b-[#FDB813]">
        {/* Ornamen Latar Elegan */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-24 -mb-8 w-28 h-28 rounded-full bg-[#FDB813]/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 border border-white/20">
                <UserPlus className="w-3.5 h-3.5 text-[#FFDD00]" />
                Modul Pendaftaran Keanggotaan
              </span>
              <span className="text-[10px] text-blue-200/80 font-mono">
                DPW Partai NasDem Sulut
              </span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
              Pendaftaran Anggota Baru &amp; Rekrutmen Kader
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Formulir resmi pendaftaran kader baru dilengkapi Pemindai KTP &amp; OCR AI otomatis.
              Data akan terverifikasi dan langsung masuk ke database wilayah Sulawesi Utara.
            </p>
          </div>

          {/* Tombol Pintasan Cepat */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
                title="Kembali ke Dashboard Utama"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

            {onNavigateToEktaDpp && (
              <button
                type="button"
                onClick={onNavigateToEktaDpp}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FDB813] hover:bg-[#e5a610] text-slate-900 shadow-2xs transition-colors cursor-pointer"
                title="Beralih ke Halaman Pendaftaran e-KTA Pusat (DPP)"
              >
                <Globe className="w-3.5 h-3.5 text-slate-900" />
                <span>e-KTA Pusat (DPP)</span>
              </button>
            )}

            {onNavigateToMembers && (
              <button
                type="button"
                onClick={onNavigateToMembers}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
                title="Lihat Database Seluruh Kader"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Daftar Kader</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Strip Ringkas Perekrut */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-blue-100 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-[#FFDD00]" />
              Perekrut: <strong className="text-white">{perekrutNama}</strong> ({perekrutJabatan})
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-[#FFDD00]" />
              Kode Referral: <strong className="text-[#FFDD00]">{myReferralCode}</strong>
            </span>
          </div>

          <div className="text-[11px] text-blue-200 font-medium">
            Wilayah Akses: <strong>{session.dpdAccess || 'Sulawesi Utara'}</strong>
          </div>
        </div>
      </div>

      {/* 2. Container Form Utama: Lebar Penuh & Bebas dari Kotak Dialog Popup */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-6 md:p-8">
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

      {/* 3. Catatan Bantuan Tambahan */}
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
