import React from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  QrCode,
  Shield,
  Edit3,
  User,
  Camera,
  FileText,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
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
}) => {
  const memberPhoto = resolveImageUrl(activePengurusMember?.fotoProfilUrl);
  const isAnggota = session.role === 'ANGGOTA';

  // ================= TAMPILAN KHUSUS ANGGOTA BIASA (PROFIL LENGKAP & FOTO MANDIRI) =================
  if (isAnggota) {
    const memberKtp = resolveImageUrl(activePengurusMember?.fotoKtpUrl);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
        {/* Kolom Kiri: Pas Foto Profil & Ringkasan Akun */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col items-center text-center">
            {/* Foto Profil Utama yang Besar */}
            <div className="relative mb-4">
              <div className="w-32 h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-blue-600/40 overflow-hidden shadow-md flex items-center justify-center">
                {memberPhoto ? (
                  <img
                    src={memberPhoto}
                    alt={activePengurusMember?.namaLengkap || 'Foto Profil'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3">
                    <User className="w-12 h-12 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Belum Ada Pas Foto
                    </span>
                  </div>
                )}
              </div>

              {onOpenEditProfile && (
                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-md transition-all cursor-pointer"
                  title="Ubah Foto Profil & Berkas"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-1.5">
              Kader Anggota Resmi
            </span>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {activePengurusMember?.namaLengkap || session.adminName}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Partai NasDem Sulawesi Utara
            </p>

            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Status: Aktif Terdaftar</span>
            </div>
          </div>

          {/* Tombol Ubah Data */}
          {onOpenEditProfile && (
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil &amp; Unggah Foto</span>
            </button>
          )}
        </div>

        {/* Kolom Kanan: Detail Dokumen, Kontak & Domisili */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identitas Resmi */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Nomor Identitas Resmi</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Nomor NIK KTP</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {activePengurusMember?.nik || session.adminNik || '-'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Nomor e-KTA (Pusat DPP)</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
                  {activePengurusMember?.nomorEKTA || activePengurusMember?.nik || '-'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Tempat &amp; Tanggal Lahir</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activePengurusMember?.tempatLahir || '-'}
                  {activePengurusMember?.tanggalLahir ? `, ${activePengurusMember.tanggalLahir}` : ''}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Jenis Kelamin &amp; Agama</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activePengurusMember?.jenisKelamin || '-'} • {activePengurusMember?.agama || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Kontak & Domisili Wilayah */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Kontak &amp; Wilayah Domisili</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Nomor WhatsApp / HP</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activePengurusMember?.nomorHP || '-'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Email / Media Sosial</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activePengurusMember?.email || activePengurusMember?.sosmed || '-'}
                </span>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-1">Wilayah Domisili</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activePengurusMember?.dpd || session.dpdAccess || 'Sulawesi Utara'}
                  {activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? ` • Kec. ${activePengurusMember.dpc}` : ''}
                  {activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? ` • Desa/Kel. ${activePengurusMember.dprt}` : ''}
                </span>
                {activePengurusMember?.alamatLengkap && (
                  <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px]">
                    {activePengurusMember.alamatLengkap}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Berkas KTP */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Berkas Foto KTP Fisik</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                memberKtp
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {memberKtp ? 'Foto KTP Terlampir' : 'Belum Ada Foto KTP'}
              </span>
            </div>

            {memberKtp ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-2">
                <img
                  src={memberKtp}
                  alt="Foto KTP"
                  className="max-h-52 w-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Berkas foto KTP belum diunggah. Anda dapat melengkapi foto KTP Anda melalui tombol <strong>Edit Profil &amp; Unggah Foto</strong>.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= TAMPILAN PENGURUS STRUKTURAL (REFERRAL & SUPERVISI) =================
  return (
    <div className={`grid grid-cols-1 ${ketuaLangsung ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
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
              <span className="text-slate-500 font-medium">
                {activePengurusMember?.nomorSK ? 'Nomor SK' : 'Status SK'}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {activePengurusMember?.nomorSK || 'SK-DPW-SULUT-2024'}
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
