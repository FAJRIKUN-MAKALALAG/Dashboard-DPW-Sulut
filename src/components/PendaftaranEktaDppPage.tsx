import React from 'react';
import {
  Globe,
  ArrowLeft,
  UserPlus,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Member } from '../types';
import { DppEktaRegistrationPanel } from '../dpp-ekta';

interface PendaftaranEktaDppPageProps {
  members: Member[];
  initialMember?: Member | null;
  onMemberEktaUpdated?: (nik: string, nokta: string, updatedMember?: Member) => void;
  onBackToDashboard?: () => void;
  onNavigateToPendaftaran?: () => void;
  onNavigateToMembers?: () => void;
}

export const PendaftaranEktaDppPage: React.FC<PendaftaranEktaDppPageProps> = ({
  members,
  initialMember,
  onMemberEktaUpdated,
  onBackToDashboard,
  onNavigateToPendaftaran,
  onNavigateToMembers,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-page-enter pb-16 font-sans">
      {/* 1. Header Banner Bersih & Selaras Tema NasDem */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3282] via-[#21409A] to-[#1A3282] text-white p-4 sm:p-6 shadow-sm border border-blue-900 border-b-2 border-b-[#FDB813]">
        {/* Ornamen Elegan */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-28 -mb-8 w-28 h-28 rounded-full bg-[#FDB813]/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white/15 text-blue-100 border border-white/20">
                <Globe className="w-3.5 h-3.5 text-[#FFDD00]" />
                Modul e-KTA Digital NasDem (Pusat)
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-semibold">
                digital.partainasdem.id
              </span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
              Pendaftaran &amp; Penerbitan e-KTA Pusat (DPP)
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Penerbitan kartu e-KTA digital resmi 16 digit langsung ke server Dewan Pimpinan Pusat (DPP) Partai NasDem.
              Kader ber-SK yang belum memiliki e-KTA dapat langsung diproses tanpa mengubah posisi jabatannya.
            </p>
          </div>

          {/* Tombol Aksi Cepat */}
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

            {onNavigateToPendaftaran && (
              <button
                type="button"
                onClick={onNavigateToPendaftaran}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#FDB813] hover:bg-[#e5a610] text-slate-900 shadow-2xs transition-colors cursor-pointer"
                title="Buka Pendaftaran Anggota Baru Lokal DPW Sulut"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-900" />
                <span>Daftar Anggota Baru</span>
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

        {/* Info Strip */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-blue-100 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FFDD00]" />
              Status: <strong className="text-white">API Gateway Digital NasDem Aktif</strong>
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-1 text-slate-200">
              <Sparkles className="w-3 h-3 text-[#FFDD00]" />
              Otomatis sinkron ke database profil &amp; matriks teritorial
            </span>
          </div>

          <a
            href="https://digital.partainasdem.id/v1/index?page=login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-white font-medium underline underline-offset-2"
          >
            <span>Buka Portal Pusat DPP</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 2. Container Panel Utama: Lebar Penuh Responsif di Mobile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-6 md:p-8">
          <DppEktaRegistrationPanel
            members={members}
            initialMember={initialMember}
            onMemberEktaUpdated={onMemberEktaUpdated}
          />
        </div>
      </div>
    </div>
  );
};
