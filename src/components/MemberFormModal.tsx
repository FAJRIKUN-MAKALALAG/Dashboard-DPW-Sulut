import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS, PARTY_ROLES, STATUS_OPTIONS, LEVEL_PARTY_ROLES } from '../data/sulutRegions';
import { compressImageFile, generateSimulatedKtp, getInitials, getAvatarColor } from '../utils/imageUtils';
import {
  UserPlus,
  Edit3,
  X,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Camera,
  Upload,
  IdCard,
  Trash2,
  Sparkles,
  MapPin,
  FileText,
  User,
} from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member, isEdit: boolean, originalNik?: string) => void;
  initialMember?: Member | null;
  existingMembers: Member[];
  session: UserSession;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMember,
  existingMembers,
  session,
}) => {
  if (!isOpen) return null;

  const isEdit = !!initialMember;

  const defaultDpd =
    session.role !== 'SUPER_ADMIN' && session.dpdAccess && session.dpdAccess !== 'ALL'
      ? session.dpdAccess
      : initialMember?.dpd || SULUT_REGIONS[0].name;

  const defaultDpc =
    (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') && session.dpcAccess
      ? session.dpcAccess
      : initialMember?.dpc || '';

  const defaultDprt =
    session.role === 'ADMIN_DPRT' && session.dprtAccess
      ? session.dprtAccess
      : initialMember?.dprt || '';

  const [nik, setNik] = useState<string>(initialMember?.nik || '');
  const [nomorEKTA, setNomorEKTA] = useState<string>(initialMember?.nomorEKTA || '');
  const [namaLengkap, setNamaLengkap] = useState<string>(initialMember?.namaLengkap || '');
  const [nomorHP, setNomorHP] = useState<string>(initialMember?.nomorHP || '');
  const [email, setEmail] = useState<string>(initialMember?.email || '');
  const [sosmed, setSosmed] = useState<string>(initialMember?.sosmed || '');
  const [dpd, setDpd] = useState<string>(defaultDpd);
  const [dpc, setDpc] = useState<string>(defaultDpc);
  const [dprt, setDprt] = useState<string>(defaultDprt);

  // Status Kepengurusan & SK
  const [isPengurus, setIsPengurus] = useState<boolean>(initialMember?.isPengurus ?? true);
  const [tingkatKepengurusan, setTingkatKepengurusan] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus'>(
    initialMember?.tingkatKepengurusan || 'DPW'
  );
  const [wilayahPenugasan, setWilayahPenugasan] = useState<string>(initialMember?.wilayahPenugasan || 'DPW Sulawesi Utara');
  const [nomorSK, setNomorSK] = useState<string>(initialMember?.nomorSK || '');
  const [tanggalSK, setTanggalSK] = useState<string>(initialMember?.tanggalSK || '');
  const [kodeReferral, setKodeReferral] = useState<string>(initialMember?.kodeReferral || '');

  const [jabatan, setJabatan] = useState<string>(initialMember?.jabatan || 'Pengurus DPW NasDem');
  const [status, setStatus] = useState<MemberStatus>(initialMember?.status || 'Aktif');
  const [catatanMutasi, setCatatanMutasi] = useState<string>(initialMember?.catatanMutasi || '');
  const [fotoProfilUrl, setFotoProfilUrl] = useState<string>(initialMember?.fotoProfilUrl || '');
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string>(initialMember?.fotoKtpUrl || '');
  const [kaderPerekrutNama, setKaderPerekrutNama] = useState<string>(
    initialMember?.kaderPerekrutNama || ''
  );
  const [kaderPerekrutJabatan, setKaderPerekrutJabatan] = useState<string>(
    initialMember?.kaderPerekrutJabatan || 'Pengurus DPW/DPD NasDem'
  );
  const [kaderPerekrutKodeReferral, setKaderPerekrutKodeReferral] = useState<string>(
    initialMember?.kaderPerekrutKodeReferral || ''
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isUploadingKtp, setIsUploadingKtp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  // Synchronize form states whenever initialMember or modal openness changes
  useEffect(() => {
    if (initialMember) {
      setNik(initialMember.nik || '');
      setNomorEKTA(initialMember.nomorEKTA || '');
      setNamaLengkap(initialMember.namaLengkap || '');
      setNomorHP(initialMember.nomorHP && initialMember.nomorHP !== '-' ? initialMember.nomorHP : '');
      setEmail(initialMember.email || '');
      setSosmed(initialMember.sosmed || '');
      setDpd(initialMember.dpd || defaultDpd);
      setDpc(initialMember.dpc || defaultDpc);
      setDprt(initialMember.dprt || defaultDprt);
      setIsPengurus(initialMember.isPengurus ?? true);
      setTingkatKepengurusan(initialMember.tingkatKepengurusan || 'DPW');
      setWilayahPenugasan(initialMember.wilayahPenugasan || 'DPW Sulawesi Utara');
      setNomorSK(initialMember.nomorSK || '');
      setTanggalSK(initialMember.tanggalSK || '');
      setKodeReferral(initialMember.kodeReferral || '');
      setJabatan(initialMember.jabatan || 'Pengurus DPW NasDem');
      setStatus(initialMember.status || 'Aktif');
      setCatatanMutasi(initialMember.catatanMutasi || '');
      setFotoProfilUrl(initialMember.fotoProfilUrl || '');
      setFotoKtpUrl(initialMember.fotoKtpUrl || '');
      setKaderPerekrutNama(initialMember.kaderPerekrutNama || '');
      setKaderPerekrutJabatan(initialMember.kaderPerekrutJabatan || 'Pengurus DPW/DPD NasDem');
      setKaderPerekrutKodeReferral(initialMember.kaderPerekrutKodeReferral || '');
      setErrorMsg(null);
    } else {
      setNik('');
      setNomorEKTA('');
      setNamaLengkap('');
      setNomorHP('');
      setEmail('');
      setSosmed('');
      setDpd(defaultDpd);
      setDpc(defaultDpc);
      setDprt(defaultDprt);
      setIsPengurus(true);
      setTingkatKepengurusan('DPW');
      setWilayahPenugasan('DPW Sulawesi Utara');
      setNomorSK('');
      setTanggalSK('');
      setKodeReferral('');
      setJabatan('Pengurus DPW NasDem');
      setStatus('Aktif');
      setCatatanMutasi('');
      setFotoProfilUrl('');
      setFotoKtpUrl('');
      setKaderPerekrutNama('');
      setKaderPerekrutJabatan('Pengurus DPW/DPD NasDem');
      setKaderPerekrutKodeReferral('');
      setErrorMsg(null);
    }
  }, [initialMember, isOpen]);

  // Available subdistricts for chosen DPD
  const currentRegion = SULUT_REGIONS.find((r) => r.name === dpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  // Cleaned NIK (digits only)
  const cleanedNik = useMemo(() => nik.replace(/[^0-9]/g, '').trim(), [nik]);
  const originalCleanNik = useMemo(
    () => (initialMember?.nik ? initialMember.nik.replace(/[^0-9]/g, '').trim() : ''),
    [initialMember]
  );
  // True if in edit mode and the NIK matches the original member's NIK
  const isUnchangedNik = isEdit && cleanedNik !== '' && cleanedNik === originalCleanNik;

  // Otomatis buat Kode Referral untuk Pengurus jika belum ada
  useEffect(() => {
    if (isPengurus && !kodeReferral && cleanedNik.length >= 4) {
      const code = `REF-${tingkatKepengurusan}-${cleanedNik.slice(-4)}`;
      setKodeReferral(code);
    } else if (!isPengurus) {
      setKodeReferral('');
    }
  }, [isPengurus, tingkatKepengurusan, cleanedNik]);

  // REAL-TIME DUPLICATE DETECTION (Never flags the edited member itself as duplicate)
  const duplicateMember = useMemo(() => {
    if (!cleanedNik) return null;
    // When editing and NIK is unchanged, it is the member themselves — never a duplicate error
    if (isEdit && isUnchangedNik) {
      return null;
    }
    return existingMembers.find((m) => {
      // In edit mode, exclude the initial member from duplicate detection
      if (isEdit && initialMember) {
        if (m.nik === initialMember.nik) return false;
        const mClean = (m.nik || '').replace(/[^0-9]/g, '').trim();
        if (mClean === originalCleanNik) return false;
        if (initialMember.nomorEKTA && m.nomorEKTA === initialMember.nomorEKTA) return false;
      }
      const mClean = (m.nik || '').replace(/[^0-9]/g, '').trim();
      return mClean === cleanedNik;
    });
  }, [cleanedNik, existingMembers, isEdit, isUnchangedNik, initialMember, originalCleanNik]);

  // Update default DPC if empty
  useEffect(() => {
    if (!dpc && availableSubdistricts.length > 0) {
      setDpc(availableSubdistricts[0].name);
    }
  }, [dpd]);

  // Auto-generate standard e-KTA number with ND- prefix (Partai NasDem)
  const handleAutoGenerateEkta = () => {
    const regionPrefix = cleanedNik.length >= 4 ? cleanedNik.substring(0, 4) : '7100';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNomorEKTA(`ND-${regionPrefix}-${new Date().getFullYear()}-${randomSuffix}`);
  };

  // Upload Photo handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImageFile(file, 500, 500, 0.8);
      setFotoProfilUrl(compressed);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memproses foto profil.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Upload KTP handler
  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingKtp(true);
      const compressed = await compressImageFile(file, 900, 600, 0.8);
      setFotoKtpUrl(compressed);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memproses foto KTP.');
    } finally {
      setIsUploadingKtp(false);
      if (ktpInputRef.current) ktpInputRef.current.value = '';
    }
  };

  // Generate simulated KTP
  const handleGenerateSimulatedKtp = () => {
    const simulated = generateSimulatedKtp(
      cleanedNik || '7100000000000000',
      namaLengkap || 'Kader Partai NasDem',
      dpd,
      dpc || 'Wenang',
      dprt || 'Pusat'
    );
    setFotoKtpUrl(simulated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    // Untuk edit kader yang NIK-nya tidak diubah, jangan blokir karena panjang NIK atau false duplicate
    if (!isUnchangedNik && cleanedNik.length !== 16) {
      setErrorMsg(`NIK harus tepat 16 digit angka (saat ini ${cleanedNik.length} digit).`);
      return;
    }

    if (duplicateMember) {
      setErrorMsg(
        `NIK ${cleanedNik} sudah terdaftar atas nama "${duplicateMember.namaLengkap}" (${duplicateMember.dpd}). Duplikasi data ditolak demi integritas database.`
      );
      return;
    }

    if (!namaLengkap.trim()) {
      setErrorMsg('Nama Lengkap wajib diisi.');
      return;
    }

    const finalEkta =
      nomorEKTA.trim() ||
      `ND-${cleanedNik.substring(0, 4)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalDpd =
      session.role !== 'SUPER_ADMIN' && session.dpdAccess && session.dpdAccess !== 'ALL'
        ? session.dpdAccess
        : dpd;

    const finalDpc =
      (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') && session.dpcAccess
        ? session.dpcAccess
        : dpc || 'Umum';

    const finalDprt =
      session.role === 'ADMIN_DPRT' && session.dprtAccess
        ? session.dprtAccess
        : dprt.trim() || 'Umum';

    const savedMember: Member = {
      nik: cleanedNik || (isEdit && initialMember ? initialMember.nik : ''),
      nomorEKTA: finalEkta,
      namaLengkap: namaLengkap.trim(),
      nomorHP: nomorHP.trim() || '-',
      email: email.trim() || undefined,
      sosmed: sosmed.trim() || undefined,
      dpd: finalDpd,
      dpc: finalDpc,
      dprt: finalDprt,

      // Penugasan & SK
      isPengurus,
      tingkatKepengurusan: isPengurus ? tingkatKepengurusan : 'Bukan Pengurus',
      wilayahPenugasan: isPengurus ? wilayahPenugasan.trim() : undefined,
      nomorSK: isPengurus && nomorSK.trim() ? nomorSK.trim() : undefined,
      tanggalSK: isPengurus && tanggalSK.trim() ? tanggalSK.trim() : undefined,
      kodeReferral: isPengurus ? kodeReferral.trim() : undefined,

      jabatan,
      status,
      tanggalBergabung: initialMember?.tanggalBergabung || new Date().toISOString().split('T')[0],
      catatanMutasi:
        catatanMutasi.trim() ||
        (isEdit ? initialMember?.catatanMutasi : 'Input mandiri pengurus DPW Partai NasDem Sulut'),
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
      fotoProfilUrl: fotoProfilUrl || undefined,
      fotoKtpUrl: fotoKtpUrl || undefined,
      statusKtpVerified: !!fotoKtpUrl || (isEdit ? Boolean(initialMember?.statusKtpVerified) : false),
      kaderPerekrutNama: kaderPerekrutNama.trim() || undefined,
      kaderPerekrutJabatan: kaderPerekrutNama.trim() ? kaderPerekrutJabatan.trim() : undefined,
      kaderPerekrutDpd: finalDpd,
      kaderPerekrutKodeReferral: kaderPerekrutKodeReferral.trim() || undefined,
    };

    onSave(savedMember, isEdit, initialMember?.nik);
    onClose();
  };

  const avatarColor = getAvatarColor(namaLengkap || 'NasDem');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                {isEdit ? (
                  <Edit3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                ) : (
                  <UserPlus className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {isEdit ? 'Ubah Data Lengkap Kader' : 'Registrasi Kader Baru (e-KTA DPW)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  DPW Partai NasDem Provinsi Sulawesi Utara · Shadow Database Mandiri
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Upload Foto Profil & KTP */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              <span>Foto Profil & Dokumen KTP Kader</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo Profile Box */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Foto Profil Kader
                  </label>
                  {fotoProfilUrl && (
                    <button
                      type="button"
                      onClick={() => setFotoProfilUrl('')}
                      className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-18 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {fotoProfilUrl ? (
                      <img
                        src={fotoProfilUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                      >
                        <span className="text-sm font-bold font-mono">
                          {getInitials(namaLengkap || 'ND')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="btn-white w-full py-1.5 px-2.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>{fotoProfilUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    </button>
                    <p className="text-[10px] text-slate-400">Format JPG/PNG, maks 5MB.</p>
                  </div>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* KTP Document Box */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Dokumen Foto KTP
                  </label>
                  {fotoKtpUrl && (
                    <button
                      type="button"
                      onClick={() => setFotoKtpUrl('')}
                      className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {fotoKtpUrl ? (
                      <img
                        src={fotoKtpUrl}
                        alt="Preview KTP"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IdCard className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => ktpInputRef.current?.click()}
                        disabled={isUploadingKtp}
                        className="btn-white flex-1 py-1 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-blue-500" />
                        <span>{fotoKtpUrl ? 'Ganti' : 'Unggah'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateSimulatedKtp}
                        className="btn-white py-1 px-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        title="Hasilkan e-KTP otomatis"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Auto</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Scan KTP asli atau simulasi.</p>
                  </div>
                </div>

                <input
                  ref={ktpInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleKtpUpload}
                />
              </div>
            </div>
          </div>

          {/* Section: Identitas Pokok */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Identitas Pokok Kader</span>
            </span>

            {/* Row NIK & e-KTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isEdit ? 'Nomor Induk Kependudukan (NIK Kader Terdaftar)' : 'Nomor Induk Kependudukan (NIK 16 Digit)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Contoh: 7171011504620001"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors ${
                    duplicateMember
                      ? 'border-rose-500 focus:ring-rose-400'
                      : isEdit && isUnchangedNik
                      ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  required
                />
                <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                  <span>Panjang: {cleanedNik.length}/16 digit</span>
                  {(cleanedNik.length === 16 || isUnchangedNik) && !duplicateMember && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {isEdit ? 'Kader Terverifikasi' : 'NIK Valid'}
                    </span>
                  )}
                  {duplicateMember && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> NIK Sudah Digunakan
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nomor e-KTA Partai NasDem
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateEkta}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer"
                  >
                    Auto Generate e-KTA
                  </button>
                </div>
                <input
                  type="text"
                  value={nomorEKTA}
                  onChange={(e) => setNomorEKTA(e.target.value)}
                  placeholder="Contoh: ND-7171-2024-0012"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Nama Lengkap & Nomor HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Lengkap (Beserta Gelar) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Dr. J. Victor Mailangkay, SH, MH"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor HP / WhatsApp Aktif
                </label>
                <input
                  type="text"
                  value={nomorHP}
                  onChange={(e) => setNomorHP(e.target.value)}
                  placeholder="Contoh: 081244558891"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Email & Sosial Media */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: victor.mailangkay@nasdem.id"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Media Sosial (IG / FB / TikTok / X)
                </label>
                <input
                  type="text"
                  value={sosmed}
                  onChange={(e) => setSosmed(e.target.value)}
                  placeholder="Contoh: @victor_nasdem / fb.com/victor"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Status Kepengurusan & SK Resmi */}
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Status SK Kepengurusan & Kode Referral</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-900 dark:text-blue-200">
                  <input
                    type="checkbox"
                    checked={isPengurus}
                    onChange={(e) => setIsPengurus(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Tercatat Sebagai Pengurus Ber-SK</span>
                </label>
              </div>

              {isPengurus && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Tingkat Kepengurusan
                    </label>
                    <select
                      value={tingkatKepengurusan}
                      onChange={(e) => setTingkatKepengurusan(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-semibold"
                    >
                      <option value="DPW">DPW (Tingkat Provinsi)</option>
                      <option value="DPD">DPD (Tingkat Kab/Kota)</option>
                      <option value="DPC">DPC (Tingkat Kecamatan)</option>
                      <option value="DPRt">DPRt (Tingkat Desa/Kelurahan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor SK Resmi
                    </label>
                    <input
                      type="text"
                      value={nomorSK}
                      onChange={(e) => setNomorSK(e.target.value)}
                      placeholder="Contoh: SK-DPW-04/2024"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kode Referral Pengurus (Khusus)
                    </label>
                    <input
                      type="text"
                      value={kodeReferral}
                      onChange={(e) => setKodeReferral(e.target.value)}
                      placeholder="Contoh: REF-DPW-001"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Struktur Wilayah & Penugasan */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Wilayah Struktur & Jabatan Partai</span>
            </span>

            {/* Banner info yurisdiksi jika role daerah */}
            {session.role !== 'SUPER_ADMIN' && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Yurisdiksi Wilayah Anda:{' '}
                    <strong className="text-slate-900 dark:text-white">{session.dpdAccess}</strong>
                    {session.dpcAccess && session.dpcAccess !== 'ALL' && (
                      <> &rsaquo; Kec. <strong className="text-slate-900 dark:text-white">{session.dpcAccess}</strong></>
                    )}
                    {session.dprtAccess && session.dprtAccess !== 'ALL' && (
                      <> &rsaquo; Kel/Desa <strong className="text-slate-900 dark:text-white">{session.dprtAccess}</strong></>
                    )}
                  </span>
                </div>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                  Wilayah Lain Disembunyikan
                </span>
              </div>
            )}

            {/* Input Teritorial yang Ditampilkan Sesuai Hak Akses */}
            {session.role !== 'ADMIN_DPRT' && (
              <div
                className={`grid grid-cols-1 ${
                  session.role === 'SUPER_ADMIN'
                    ? 'sm:grid-cols-3'
                    : session.role === 'ADMIN_DPD'
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-1'
                } gap-3`}
              >
                {/* DPD: Hanya ditampilkan jika Super Admin DPW */}
                {session.role === 'SUPER_ADMIN' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      DPD (Kabupaten / Kota)
                    </label>
                    <select
                      value={dpd}
                      onChange={(e) => {
                        setDpd(e.target.value);
                        const region = SULUT_REGIONS.find((r) => r.name === e.target.value);
                        if (region && region.subdistricts.length > 0) {
                          setDpc(region.subdistricts[0].name);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      {SULUT_REGIONS.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* DPC: Ditampilkan jika Super Admin DPW atau Admin DPD */}
                {(session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPD') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      DPC (Kecamatan)
                    </label>
                    <select
                      value={dpc}
                      onChange={(e) => setDpc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      {availableSubdistricts.map((sub) => (
                        <option key={sub.name} value={sub.name}>
                          Kec. {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* DPRt: Ditampilkan jika Super Admin, Admin DPD, atau Admin DPC */}
                {(session.role === 'SUPER_ADMIN' ||
                  session.role === 'ADMIN_DPD' ||
                  session.role === 'ADMIN_DPC') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      DPRt (Kelurahan / Desa)
                    </label>
                    <input
                      type="text"
                      value={dprt}
                      onChange={(e) => setDprt(e.target.value)}
                      placeholder="Contoh: Wenang Selatan"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Jabatan & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jabatan / Penugasan {isPengurus ? `(${tingkatKepengurusan})` : '(Anggota)'}
                </label>
                <select
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                >
                  {(isPengurus && tingkatKepengurusan !== 'Bukan Pengurus'
                    ? LEVEL_PARTY_ROLES[tingkatKepengurusan as 'DPW' | 'DPD' | 'DPC' | 'DPRt']
                    : LEVEL_PARTY_ROLES.UMUM
                  ).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Status Keanggotaan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MemberStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-semibold"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Catatan Lapangan / Mutasi */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Catatan Faktual / Keterangan Penugasan
              </label>
              <textarea
                rows={2}
                value={catatanMutasi}
                onChange={(e) => setCatatanMutasi(e.target.value)}
                placeholder="Contoh: Pengurus DPW Partai NasDem Sulut periode 2024-2029..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Kader Pengusung / Yang Merekrut */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Kader Perekrut (Hanya Pengurus Ber-SK yang Memiliki Kode Referral)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kode Referral Pengurus Perekrut
                  </label>
                  <input
                    type="text"
                    value={kaderPerekrutKodeReferral}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setKaderPerekrutKodeReferral(code);
                      const matched = existingMembers.find(
                        (m) => m.kodeReferral && m.kodeReferral.toUpperCase() === code
                      );
                      if (matched) {
                        setKaderPerekrutNama(matched.namaLengkap);
                        setKaderPerekrutJabatan(matched.jabatan);
                      }
                    }}
                    placeholder="Contoh: REF-DPW-001"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Kader Perekrut
                  </label>
                  <input
                    type="text"
                    value={kaderPerekrutNama}
                    onChange={(e) => setKaderPerekrutNama(e.target.value)}
                    placeholder="Nama pengurus perekrut"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jabatan Kader Perekrut
                  </label>
                  <input
                    type="text"
                    value={kaderPerekrutJabatan}
                    onChange={(e) => setKaderPerekrutJabatan(e.target.value)}
                    placeholder="Jabatan di partai"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-white px-4 py-2 text-xs font-medium rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-sm cursor-pointer transition-colors"
              >
                {isEdit ? 'Simpan Perubahan Data' : 'Daftarkan Kader ke Database'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
