import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Upload,
  IdCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Share2,
} from 'lucide-react';
import { Member, UserSession } from '../../types';
import { compressImageFile, resolveImageUrl } from '../../utils/imageUtils';
import { MemberService } from '../../services/memberService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  session?: UserSession;
  onProfileUpdated: (updatedMember: Member) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  session,
  onProfileUpdated,
}) => {
  const [namaLengkap, setNamaLengkap] = useState(member.namaLengkap || '');
  const [nomorHP, setNomorHP] = useState(member.nomorHP && member.nomorHP !== '-' ? member.nomorHP : '');
  const [email, setEmail] = useState(member.email || '');
  const [sosmed, setSosmed] = useState(member.sosmed || '');
  const [alamatLengkap, setAlamatLengkap] = useState(member.alamatLengkap || '');
  const [agama, setAgama] = useState(member.agama || '');
  const [pekerjaan, setPekerjaan] = useState(member.pekerjaan || '');
  const [tempatLahir, setTempatLahir] = useState(member.tempatLahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(member.tanggalLahir || '');
  const [jenisKelamin, setJenisKelamin] = useState(member.jenisKelamin || 'Laki-laki');

  const [fotoProfilUrl, setFotoProfilUrl] = useState<string>(member.fotoProfilUrl || '');
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string>(member.fotoKtpUrl || '');

  useEffect(() => {
    setNamaLengkap(member.namaLengkap || '');
    setNomorHP(member.nomorHP && member.nomorHP !== '-' ? member.nomorHP : '');
    setEmail(member.email || '');
    setSosmed(member.sosmed || '');
    setAlamatLengkap(member.alamatLengkap || '');
    setAgama(member.agama || '');
    setPekerjaan(member.pekerjaan || '');
    setTempatLahir(member.tempatLahir || '');
    setTanggalLahir(member.tanggalLahir || '');
    setJenisKelamin(member.jenisKelamin || 'Laki-laki');
    setFotoProfilUrl(member.fotoProfilUrl || '');
    setFotoKtpUrl(member.fotoKtpUrl || '');
  }, [member, isOpen]);

  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isCompressingKtp, setIsCompressingKtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhoto(true);
      setErrorMsg(null);
      // Kompresi di browser sebelum kirim ke backend
      const compressed = await compressImageFile(file, 800, 800, 0.82);
      setFotoProfilUrl(compressed);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memproses foto profil. Silakan gunakan format JPG atau PNG.');
    } finally {
      setIsCompressingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingKtp(true);
      setErrorMsg(null);
      const compressed = await compressImageFile(file, 1400, 1000, 0.85);
      setFotoKtpUrl(compressed);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memproses foto KTP.');
    } finally {
      setIsCompressingKtp(false);
      if (ktpInputRef.current) ktpInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedData: Partial<Member> = {
      namaLengkap,
      nomorHP,
      email,
      sosmed,
      alamatLengkap,
      agama,
      pekerjaan,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      fotoProfilUrl,
      fotoKtpUrl,
    };

    try {
      let resMember: Member | null = null;
      if (session?.role === 'ANGGOTA' || (session?.adminNik && session.adminNik === member.nik)) {
        const res = await MemberService.updateMyProfile(updatedData);
        if (res.success && res.member) {
          resMember = res.member;
        } else {
          setErrorMsg(res.error || 'Terjadi kesalahan saat menyimpan profil.');
          return;
        }
      } else {
        const fullMemberData: Member = {
          ...member,
          ...updatedData,
        };
        const ok = await MemberService.updateOne(fullMemberData, member.nik);
        if (ok) {
          resMember = fullMemberData;
        } else {
          setErrorMsg('Gagal memperbarui data profil di server.');
          return;
        }
      }

      if (resMember) {
        setSuccessMsg('Profil dan berkas foto Anda berhasil diperbarui!');
        onProfileUpdated(resMember);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayPhoto = resolveImageUrl(fotoProfilUrl);
  const displayKtp = resolveImageUrl(fotoKtpUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Edit Profil &amp; Berkas Foto Mandiri</h2>
              <p className="text-xs text-blue-200">
                Lengkapi data kontak, alamat domisili, foto profil, dan dokumen KTP Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Bagian Berkas Foto: Profil & KTP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            {/* 1. Foto Profil */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Foto Profil Resmi
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-24 rounded-xl border-2 border-blue-600/40 bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {displayPhoto ? (
                    <img
                      src={displayPhoto}
                      alt="Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">Belum ada</span>
                    </div>
                  )}
                  {isCompressingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="profile-photo-input"
                  />
                  <button
                    type="button"
                    disabled={isCompressingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{fotoProfilUrl ? 'Ganti Foto' : 'Pilih Foto'}</span>
                  </button>
                  {fotoProfilUrl && (
                    <button
                      type="button"
                      onClick={() => setFotoProfilUrl('')}
                      className="w-full text-center text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Disimpan otomatis ke WebP server terkompresi.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Foto KTP */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Foto / Dokumen KTP
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-28 h-20 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {displayKtp ? (
                    <img
                      src={displayKtp}
                      alt="KTP"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <IdCard className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">Belum ada</span>
                    </div>
                  )}
                  {isCompressingKtp && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <input
                    ref={ktpInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleKtpUpload}
                    className="hidden"
                    id="ktp-photo-input"
                  />
                  <button
                    type="button"
                    disabled={isCompressingKtp}
                    onClick={() => ktpInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{fotoKtpUrl ? 'Ganti KTP' : 'Unggah KTP'}</span>
                  </button>
                  {fotoKtpUrl && (
                    <button
                      type="button"
                      onClick={() => setFotoKtpUrl('')}
                      className="w-full text-center text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Berkas
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Format aman untuk verifikasi keanggotaan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Identitas Read-Only (Dikunci demi integritas SK & KTP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Nomor NIK KTP (Terkunci)</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{member.nik}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Nomor e-KTA NasDem (Terkunci)</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{member.nomorEKTA || '-'}</p>
            </div>
          </div>

          {/* Form Input Biodata & Kontak */}
          <div className="space-y-4 text-xs">
            {/* Nama Lengkap */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Lengkap (Sesuai KTP)
              </label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Nomor HP & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="08xxxxxxxxxx"
                    value={nomorHP}
                    onChange={(e) => setNomorHP(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Alamat Email (Opsional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Media Sosial */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Akun Media Sosial (Instagram / Facebook / TikTok)
              </label>
              <div className="relative">
                <Share2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="@username atau link profil sosmed"
                  value={sosmed}
                  onChange={(e) => setSosmed(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  placeholder="Kota / Kabupaten Kelahiran"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Jenis Kelamin, Agama & Pekerjaan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Agama
                </label>
                <input
                  type="text"
                  placeholder="Islam, Kristen, dll."
                  value={agama}
                  onChange={(e) => setAgama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pekerjaan / Profesi
                </label>
                <input
                  type="text"
                  placeholder="Wiraswasta, ASN, dll."
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Alamat Lengkap Domisili KTP */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Alamat Lengkap Domisili KTP
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  placeholder="Jalan, No. Rumah, RT/RW, Kelurahan/Desa, Kecamatan..."
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Tombol Aksi */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressingPhoto || isCompressingKtp}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Server...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
