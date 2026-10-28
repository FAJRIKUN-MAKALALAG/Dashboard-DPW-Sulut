import React from 'react';
import { Sparkles, Copy, Check, Share2, QrCode, Shield, Edit3, User, CreditCard } from 'lucide-react';
import { Member, UserSession } from '../../types';
import { resolveImageUrl } from '../../utils/imageUtils';

interface KetuaLangsungInfo {
  nik: string;
  nama: string;
  jabatan: string;
  tingkat: string;
  kodeReferral?: string;
}

interface PengurusHierarchyCardProps {
  activePengurusMember: Member | null;
  profile: any;
  session: UserSession;
  ketuaLangsung: KetuaLangsungInfo | null;
  myReferralCode: string;
  copiedCode: string | null;
  handleCopy: (code: string, label: string) => void;
  shareText: string;
  showQr: boolean;
  setShowQr: (show: boolean) => void;
  onOpenEditProfile?: () => void;
  onOpenCardModal?: (member: Member) => void;
}

export const PengurusHierarchyCard: React.FC<PengurusHierarchyCardProps> = ({
  activePengurusMember,
  profile,
  session,
  ketuaLangsung,
  myReferralCode,
  copiedCode,
  handleCopy,
  shareText,
  showQr,
  setShowQr,
  onOpenEditProfile,
  onOpenCardModal,
}) => {
  const memberPhoto = resolveImageUrl(activePengurusMember?.fotoProfilUrl);
  const isAnggota = session.role === 'ANGGOTA';

  return (
    <div className={`grid grid-cols-1 ${!isAnggota && ketuaLangsung ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
      {/* Kolom Kiri: Profil & Status SK */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-blue-700 text-white font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden border border-blue-600/30">
              {memberPhoto ? (
                <img
                  src={memberPhoto}
                  alt={activePengurusMember?.namaLengkap || 'Foto Profil'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (activePengurusMember?.namaLengkap || session.adminName || 'ND')
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-1">
                {session.role === 'ANGGOTA' || activePengurusMember?.tingkatKepengurusan === 'Bukan Pengurus'
                  ? 'Kader Anggota Resmi'
                  : `Pengurus ${activePengurusMember?.tingkatKepengurusan || session.role.replace('ADMIN_', '')}`}
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
              <span className="text-slate-500 font-medium">
                {activePengurusMember?.nomorSK ? 'Nomor SK' : 'Status SK'}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {activePengurusMember?.nomorSK || (session.role === 'ANGGOTA' ? 'Belum Ada SK (Kader Biasa)' : 'SK-DPW-SULUT-2024')}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {activePengurusMember?.status || 'Aktif'}
            </span>
          </div>

          {onOpenEditProfile && (
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profil &amp; Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Pratinjau e-KTA Digital (untuk ANGGOTA) ATAU Referral & Supervisi (untuk PENGURUS/ADMIN) */}
      {isAnggota ? (
        <div className="rounded-2xl bg-gradient-to-br from-[#002B49] via-[#003865] to-[#081b2c] border border-blue-900/50 p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Efek Cahaya Halus & Watermark */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header Kartu e-KTA */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                  ND
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase text-white leading-tight">
                    PARTAI NASDEM
                  </h4>
                  <p className="text-[10px] text-amber-400 font-semibold tracking-wide leading-tight">
                    DEWAN PIMPINAN WILAYAH SULAWESI UTARA
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-400 text-slate-900 shadow-2xs">
                e-KTA RESMI
              </span>
            </div>

            {/* Konten Kartu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 items-center">
              {/* Foto Profil */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-28 rounded-xl bg-slate-800 border-2 border-amber-400/80 overflow-hidden shadow-inner flex items-center justify-center">
                  {memberPhoto ? (
                    <img
                      src={memberPhoto}
                      alt={activePengurusMember?.namaLengkap || 'Foto Profil'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <User className="w-8 h-8 text-white/40 mx-auto mb-1" />
                      <span className="text-[9px] text-white/50 block">Belum Ada Foto</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-300 font-medium tracking-tight text-center">
                  Pas Foto Resmi
                </span>
              </div>

              {/* Data Identitas Kader */}
              <div className="sm:col-span-2 space-y-2.5">
                <div>
                  <span className="text-[10px] text-blue-200/80 font-medium uppercase tracking-wider block">
                    Nama Lengkap
                  </span>
                  <div className="text-base font-bold text-white tracking-wide">
                    {activePengurusMember?.namaLengkap || session.adminName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-blue-200/80 font-medium uppercase tracking-wider block">
                      Nomor e-KTA
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-300 block">
                      {activePengurusMember?.nomorEKTA || activePengurusMember?.nik || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-200/80 font-medium uppercase tracking-wider block">
                      NIK KTP
                    </span>
                    <span className="font-mono text-xs text-white/90 block">
                      {activePengurusMember?.nik || session.adminNik || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-blue-200/80 font-medium uppercase tracking-wider block">
                    Wilayah Domisili
                  </span>
                  <p className="text-xs text-slate-200 font-medium">
                    {activePengurusMember?.dpd || session.dpdAccess}
                    {activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? ` • Kec. ${activePengurusMember.dpc}` : ''}
                    {activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? ` • Desa/Kel. ${activePengurusMember.dprt}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Kartu & Aksi */}
          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: <strong className="text-white">Kader Aktif Terdaftar</strong></span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenCardModal && activePengurusMember && (
                <button
                  type="button"
                  onClick={() => onOpenCardModal(activePengurusMember)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-sm transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Lihat e-KTA Penuh / Cetak</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : ketuaLangsung ? (
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
                  type="button"
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
                type="button"
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
                      type="button"
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
                type="button"
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
              type="button"
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
  );
};
