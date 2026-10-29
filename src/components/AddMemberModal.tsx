import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS, LEVEL_PARTY_ROLES } from '../data/sulutRegions';
import { compressImageFile, generateSimulatedKtp, getInitials, getAvatarColor } from '../utils/imageUtils';
import {
  UserPlus,
  X,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Upload,
  IdCard,
  Trash2,
  Sparkles,
  User,
  Loader2,
  Shield,
} from 'lucide-react';
import { referralService } from '../services/referralService';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newMember: Member) => void;
  existingMembers: Member[];
  session: UserSession;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingMembers,
  session,
}) => {
  const matchedDpd = session.dpdAccess && session.dpdAccess !== 'ALL'
    ? SULUT_REGIONS.find((r) => isDpdMatch(r.name, session.dpdAccess))
    : null;
  const canonicalDpd = matchedDpd ? matchedDpd.name : (session.dpdAccess || SULUT_REGIONS[0].name);

  const defaultDpd =
    session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN_DPW' && session.dpdAccess && session.dpdAccess !== 'ALL'
      ? canonicalDpd
      : SULUT_REGIONS[0].name;

  const defaultDpc =
    (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') && session.dpcAccess
      ? session.dpcAccess
      : '';

  const defaultDprt =
    session.role === 'ADMIN_DPRT' && session.dprtAccess
      ? session.dprtAccess
      : '';

  const isDpdLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    Boolean(session.dpdAccess && session.dpdAccess !== 'ALL');

  const isDpcLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') &&
    Boolean(session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)');

  const isDprtLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    session.role === 'ADMIN_DPRT' &&
    Boolean(session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum');

  const allowedTingkatOptions = useMemo(() => {
    if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW') {
      return [
        { value: 'DPW', label: 'DPW (Tingkat Provinsi)' },
        { value: 'DPD', label: 'DPD (Kabupaten / Kota)' },
        { value: 'DPC', label: 'DPC (Kecamatan)' },
        { value: 'DPRt', label: 'DPRt (Kelurahan / Desa)' },
      ];
    }
    if (session.role === 'ADMIN_DPD') {
      return [
        { value: 'DPD', label: 'DPD (Kabupaten / Kota)' },
        { value: 'DPC', label: 'DPC (Kecamatan)' },
        { value: 'DPRt', label: 'DPRt (Kelurahan / Desa)' },
      ];
    }
    if (session.role === 'ADMIN_DPC') {
      return [
        { value: 'DPC', label: 'DPC (Kecamatan)' },
        { value: 'DPRt', label: 'DPRt (Kelurahan / Desa)' },
      ];
    }
    return [{ value: 'DPRt', label: 'DPRt (Kelurahan / Desa)' }];
  }, [session.role]);

  const defaultTingkat: 'DPW' | 'DPD' | 'DPC' | 'DPRt' =
    session.role === 'ADMIN_DPRT'
      ? 'DPRt'
      : session.role === 'ADMIN_DPC'
      ? 'DPC'
      : session.role === 'ADMIN_DPD'
      ? 'DPD'
      : 'DPW';

  const defaultWilayahPenugasan =
    session.role === 'ADMIN_DPRT'
      ? `DPRt ${session.dprtAccess || ''}`
      : session.role === 'ADMIN_DPC'
      ? `DPC Kec. ${session.dpcAccess || ''}`
      : session.role === 'ADMIN_DPD'
      ? `DPD ${session.dpdAccess || ''}`
      : 'DPW Sulawesi Utara';

  const [nik, setNik] = useState<string>('');
  const [nomorEKTA, setNomorEKTA] = useState<string>('');
  const [namaLengkap, setNamaLengkap] = useState<string>('');
  const [nomorHP, setNomorHP] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [sosmed, setSosmed] = useState<string>('');
  const [dpd, setDpd] = useState<string>(defaultDpd);
  const [dpc, setDpc] = useState<string>(defaultDpc);
  const [dprt, setDprt] = useState<string>(defaultDprt);

  // Status Kepengurusan & SK
  const [isPengurus, setIsPengurus] = useState<boolean>(true);
  const [tingkatKepengurusan, setTingkatKepengurusan] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus'>(defaultTingkat);
  const [wilayahPenugasan, setWilayahPenugasan] = useState<string>(defaultWilayahPenugasan);
  const [nomorSK, setNomorSK] = useState<string>('');
  const [tanggalSK, setTanggalSK] = useState<string>('');
  const [kodeReferral, setKodeReferral] = useState<string>('');

  const [jabatan, setJabatan] = useState<string>('Pengurus DPW NasDem');
  const [status, setStatus] = useState<MemberStatus>('Aktif');
  const [catatanMutasi, setCatatanMutasi] = useState<string>('');
  const [fotoProfilUrl, setFotoProfilUrl] = useState<string>('');
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string>('');
  const [kaderPerekrutNama, setKaderPerekrutNama] = useState<string>('');
  const [kaderPerekrutJabatan, setKaderPerekrutJabatan] = useState<string>('Pengurus DPW/DPD NasDem');
  const [kaderPerekrutKodeReferral, setKaderPerekrutKodeReferral] = useState<string>('');
  const [kaderPerekrutNik, setKaderPerekrutNik] = useState<string>('');
  const [ketuaLangsungInfo, setKetuaLangsungInfo] = useState<{ nik: string; nama: string; jabatan: string; tingkat: string } | null>(null);
  const [refValidation, setRefValidation] = useState<{ loading: boolean; valid?: boolean; error?: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isUploadingKtp, setIsUploadingKtp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  // Live validation for referral code
  useEffect(() => {
    const clean = kaderPerekrutKodeReferral.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setRefValidation(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setRefValidation({ loading: true });
      try {
        const res = await referralService.validateReferralCode(clean);
        if (!active) return;
        if (res.valid && res.recruiter) {
          setRefValidation({ loading: false, valid: true });
          setKaderPerekrutNama(res.recruiter.namaLengkap);
          setKaderPerekrutJabatan(res.recruiter.jabatan);
          setKaderPerekrutNik(res.recruiter.nik);
          if (res.directLeader) {
            setKetuaLangsungInfo(res.directLeader);
          }
        } else {
          setRefValidation({ loading: false, valid: false, error: res.error || 'Kode referral tidak ditemukan' });
        }
      } catch (e: any) {
        if (!active) return;
        setRefValidation({ loading: false, valid: false, error: 'Gagal memvalidasi kode' });
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kaderPerekrutKodeReferral]);

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
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
      setKaderPerekrutNik('');
      setKetuaLangsungInfo(null);
      setRefValidation(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const currentRegion = SULUT_REGIONS.find((r) => r.name === dpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  const cleanedNik = useMemo(() => nik.replace(/[^0-9]/g, '').trim(), [nik]);

  // Duplicate detection for new registration
  const duplicateMember = useMemo(() => {
    if (!cleanedNik) return null;
    return existingMembers.find((m) => {
      const mClean = (m.nik || '').replace(/[^0-9]/g, '').trim();
      return mClean === cleanedNik || m.nik === cleanedNik;
    });
  }, [cleanedNik, existingMembers]);

  // Generate Referral Code for Pengurus
  useEffect(() => {
    if (isPengurus && !kodeReferral && cleanedNik.length >= 4) {
      const code = `REF-${tingkatKepengurusan}-${cleanedNik.slice(-4)}`;
      setKodeReferral(code);
    } else if (!isPengurus) {
      setKodeReferral('');
    }
  }, [isPengurus, tingkatKepengurusan, cleanedNik]);

  // Update default DPC if empty
  useEffect(() => {
    if (!dpc && availableSubdistricts.length > 0) {
      setDpc(availableSubdistricts[0].name);
    }
  }, [dpd]);

  if (!isOpen) return null;

  const handleAutoGenerateEkta = () => {
    // Generate nomor e-KTA format numerik DPP NasDem (16 digit angka)
    const base = cleanedNik.length === 16 ? cleanedNik : `2503${Date.now()}`.padEnd(16, '0').slice(0, 16);
    setNomorEKTA(base);
  };

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

    if (cleanedNik.length !== 16) {
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

    // Gunakan nomor e-KTA persis seperti yang diinput (nomor e-KTA resmi DPP NasDem)
    const finalEkta = nomorEKTA.trim() || cleanedNik || '-';

    const finalDpd = isDpdLocked ? canonicalDpd : dpd;
    const finalDpc = isDpcLocked ? defaultDpc : (dpc || 'Umum');
    const finalDprt = isDprtLocked ? defaultDprt : (dprt.trim() || 'Umum');

    if (isDpdLocked && !isDpdMatch(finalDpd, canonicalDpd)) {
      setErrorMsg(`Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di wilayah ${canonicalDpd}.`);
      return;
    }

    if (isDpcLocked && !isDpcMatch(finalDpc, defaultDpc)) {
      setErrorMsg(`Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kecamatan ${defaultDpc}.`);
      return;
    }

    if (isDprtLocked && !isDprtMatch(finalDprt, defaultDprt)) {
      setErrorMsg(`Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kelurahan/desa ${defaultDprt}.`);
      return;
    }

    const newMember: Member = {
      nik: cleanedNik,
      nomorEKTA: finalEkta,
      namaLengkap: namaLengkap.trim(),
      nomorHP: nomorHP.trim() || '-',
      email: email.trim() || undefined,
      sosmed: sosmed.trim() || undefined,
      dpd: finalDpd,
      dpc: finalDpc,
      dprt: finalDprt,

      isPengurus,
      tingkatKepengurusan: isPengurus ? tingkatKepengurusan : 'Bukan Pengurus',
      wilayahPenugasan: isPengurus ? wilayahPenugasan.trim() : undefined,
      nomorSK: isPengurus && nomorSK.trim() ? nomorSK.trim() : undefined,
      tanggalSK: isPengurus && tanggalSK.trim() ? tanggalSK.trim() : undefined,
      kodeReferral: isPengurus ? kodeReferral.trim() : undefined,

      jabatan,
      status,
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: catatanMutasi.trim() || 'Registrasi kader baru mandiri DPW Partai NasDem Sulut',
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
      fotoProfilUrl: fotoProfilUrl || undefined,
      fotoKtpUrl: fotoKtpUrl || undefined,
      statusKtpVerified: !!fotoKtpUrl,
      kaderPerekrutNama: kaderPerekrutNama.trim() || undefined,
      kaderPerekrutJabatan: kaderPerekrutNama.trim() ? kaderPerekrutJabatan.trim() : undefined,
      kaderPerekrutNik: kaderPerekrutNik.trim() || undefined,
      kaderPerekrutDpd: finalDpd,
      kaderPerekrutKodeReferral: kaderPerekrutKodeReferral.trim() || undefined,
      ketuaLangsungNik: ketuaLangsungInfo?.nik || undefined,
      ketuaLangsungNama: ketuaLangsungInfo?.nama || undefined,
      ketuaLangsungJabatan: ketuaLangsungInfo?.jabatan || undefined,
      ketuaLangsungTingkat: ketuaLangsungInfo?.tingkat || undefined,
    };

    onAdd(newMember);
    onClose();
  };

  const avatarColor = getAvatarColor(namaLengkap || 'NasDem');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Centered Modal Card Container */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Registrasi Anggota Baru (e-KTA DPW)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  DPW Partai NasDem Provinsi Sulawesi Utara · Form Pendaftaran Kader Baru
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
                  <span>Identitas Pokok Anggota Baru</span>
                </span>

                {/* Row NIK & e-KTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      placeholder="Contoh: 7171011504620001"
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors ${
                        duplicateMember
                          ? 'border-rose-500 focus:ring-rose-400'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      required
                    />
                    <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                      <span>Panjang: {cleanedNik.length}/16 digit</span>
                      {cleanedNik.length === 16 && !duplicateMember && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> NIK Valid
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
                      placeholder="Contoh: 2503196713393376"
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
                          {allowedTingkatOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Nomor SK Kepengurusan
                        </label>
                        <input
                          type="text"
                          value={nomorSK}
                          onChange={(e) => setNomorSK(e.target.value)}
                          placeholder="SK-DPW-SULUT/2024/001"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Kode Referral Rekrutmen
                        </label>
                        <input
                          type="text"
                          value={kodeReferral}
                          onChange={(e) => setKodeReferral(e.target.value.toUpperCase())}
                          placeholder="REF-DPW-0001"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Struktur Domisili Daerah */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      DPD (Kabupaten / Kota)
                      {isDpdLocked && <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">(Terkunci sesuai akun)</span>}
                    </label>
                    <select
                      value={isDpdLocked ? canonicalDpd : dpd}
                      disabled={isDpdLocked}
                      onChange={(e) => {
                        if (isDpdLocked) return;
                        setDpd(e.target.value);
                        const region = SULUT_REGIONS.find((r) => r.name === e.target.value);
                        if (region && region.subdistricts.length > 0) {
                          setDpc(region.subdistricts[0].name);
                        }
                      }}
                      className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isDpdLocked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
                      }`}
                    >
                      {isDpdLocked ? (
                        <option value={canonicalDpd}>{canonicalDpd}</option>
                      ) : (
                        SULUT_REGIONS.map((r) => (
                          <option key={r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      DPC (Kecamatan)
                      {isDpcLocked && <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">(Terkunci sesuai akun)</span>}
                    </label>
                    <select
                      value={isDpcLocked ? defaultDpc : dpc}
                      disabled={isDpcLocked}
                      onChange={(e) => {
                        if (isDpcLocked) return;
                        setDpc(e.target.value);
                      }}
                      className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isDpcLocked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
                      }`}
                    >
                      {isDpcLocked ? (
                        <option value={defaultDpc}>Kec. {defaultDpc}</option>
                      ) : (
                        availableSubdistricts.map((sub) => (
                          <option key={sub.name} value={sub.name}>
                            Kec. {sub.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      DPRt (Kelurahan / Desa)
                      {isDprtLocked && <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">(Terkunci sesuai akun)</span>}
                    </label>
                    <input
                      type="text"
                      value={dprt}
                      disabled={isDprtLocked}
                      onChange={(e) => setDprt(e.target.value)}
                      placeholder="Contoh: Ranomeida"
                      className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                        isDprtLocked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-medium'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Jabatan & Penugasan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Jabatan / Penugasan Partai
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
                    <input
                      type="text"
                      value={status}
                      readOnly
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Catatan Lapangan */}
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

              {/* Kader Pengusung / Perekrut (Sistem Referral Berjenjang) */}
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kader Perekrut (Referral Pengurus Berjenjang)</span>
                  </span>

                  {refValidation?.loading && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Memvalidasi kode...</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kode Referral Perekrut
                    </label>
                    <input
                      type="text"
                      value={kaderPerekrutKodeReferral}
                      onChange={(e) => setKaderPerekrutKodeReferral(e.target.value.toUpperCase())}
                      placeholder="Contoh: NSD-DPC-5ZXF"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 uppercase tracking-wide"
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
                      placeholder="Otomatis dari kode referral"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Jabatan Perekrut
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

                {/* Status Validasi Real-time & Info Ketua Langsung */}
                {refValidation?.valid && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Kode Sah: {kaderPerekrutNama} ({kaderPerekrutJabatan})</span>
                    </div>
                    {ketuaLangsungInfo && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pl-5 font-medium">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          Ketua Langsung Terkait: <strong>{ketuaLangsungInfo.nama}</strong> ({ketuaLangsungInfo.jabatan}) — Perekrutan otomatis diatribusikan ke perekrut & dilaporkan ke pimpinan.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {refValidation?.valid === false && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>{refValidation.error || 'Kode referral tidak ditemukan di database resmi.'}</span>
                  </div>
                )}
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
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftarkan Anggota Baru</span>
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

