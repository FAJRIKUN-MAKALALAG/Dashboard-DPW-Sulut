import React, { useState, useEffect, useMemo } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { compressImageFile } from '../utils/imageUtils';
import {
  UserPlus,
  X,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Lock,
} from 'lucide-react';
import { referralService } from '../services/referralService';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../utils/structureReadinessUtils';
import {
  KtpCameraScannerBox,
  ExtractedKtpData,
  KtpImageQualityReport,
  decodeIndonesianNik,
} from '../ktp-scanner';
import {
  RegistrationStepProgressBar,
  WizardStepNumber,
} from './member-registration/RegistrationStepProgressBar';
import { RegistrationStep2Identity } from './member-registration/RegistrationStep2Identity';
import { RegistrationStep3AddressContact } from './member-registration/RegistrationStep3AddressContact';
import { RegistrationStep4Summary } from './member-registration/RegistrationStep4Summary';

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

  const [step, setStep] = useState<WizardStepNumber>(1);

  // Stage 1 & 2: Identity & KTP fields
  const [nik, setNik] = useState<string>('');
  const [namaLengkap, setNamaLengkap] = useState<string>('');
  const [tempatLahir, setTempatLahir] = useState<string>('');
  const [tanggalLahir, setTanggalLahir] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan' | ''>('');
  const [agama, setAgama] = useState<string>('Kristen Protestan');
  const [pekerjaan, setPekerjaan] = useState<string>('');
  const [fotoProfilUrl, setFotoProfilUrl] = useState<string>('');
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string>('');
  const [ktpQualityReport, setKtpQualityReport] = useState<KtpImageQualityReport | null>(null);
  const [ktpExtractedData, setKtpExtractedData] = useState<ExtractedKtpData | null>(null);
  const [ocrTerritoryNotice, setOcrTerritoryNotice] = useState<string | null>(null);

  // Stage 3: Address, Territory, Contact & Party Role
  const [alamatLengkap, setAlamatLengkap] = useState<string>('');
  const [dpd, setDpd] = useState<string>(defaultDpd);
  const [dpc, setDpc] = useState<string>(defaultDpc);
  const [dprt, setDprt] = useState<string>(defaultDprt);
  const [nomorHP, setNomorHP] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [sosmed, setSosmed] = useState<string>('');

  const [isPengurus, setIsPengurus] = useState<boolean>(false);
  const [tingkatKepengurusan, setTingkatKepengurusan] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus'>(defaultTingkat);
  const [wilayahPenugasan, setWilayahPenugasan] = useState<string>(defaultWilayahPenugasan);
  const [nomorSK, setNomorSK] = useState<string>('');
  const [tanggalSK, setTanggalSK] = useState<string>('');
  const [kodeReferral, setKodeReferral] = useState<string>('');

  const [jabatan, setJabatan] = useState<string>('Anggota / Kader Biasa');
  const [status, setStatus] = useState<MemberStatus>('Aktif');
  const [catatanMutasi, setCatatanMutasi] = useState<string>('');
  const [kaderPerekrutNama, setKaderPerekrutNama] = useState<string>('');
  const [kaderPerekrutJabatan, setKaderPerekrutJabatan] = useState<string>('Pengurus DPW/DPD NasDem');
  const [kaderPerekrutKodeReferral, setKaderPerekrutKodeReferral] = useState<string>('');
  const [kaderPerekrutNik, setKaderPerekrutNik] = useState<string>('');
  const [ketuaLangsungInfo, setKetuaLangsungInfo] = useState<{ nik: string; nama: string; jabatan: string; tingkat: string } | null>(null);
  const [refValidation, setRefValidation] = useState<{ loading: boolean; valid?: boolean; error?: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRegisterDpp, setAutoRegisterDpp] = useState<boolean>(true);

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
      } catch {
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
      setStep(1);
      setNik('');
      setNamaLengkap('');
      setTempatLahir('');
      setTanggalLahir('');
      setJenisKelamin('');
      setAgama('Kristen Protestan');
      setPekerjaan('');
      setAlamatLengkap('');
      setNomorHP('');
      setEmail('');
      setSosmed('');
      setDpd(defaultDpd);
      setDpc(defaultDpc);
      setDprt(defaultDprt);
      setIsPengurus(false);
      setTingkatKepengurusan(defaultTingkat);
      setWilayahPenugasan(defaultWilayahPenugasan);
      setNomorSK('');
      setTanggalSK('');
      setKodeReferral('');
      setJabatan('Anggota / Kader Biasa');
      setStatus('Aktif');
      setCatatanMutasi('');
      setFotoProfilUrl('');
      setFotoKtpUrl('');
      setKtpQualityReport(null);
      setKtpExtractedData(null);
      setOcrTerritoryNotice(null);
      setKaderPerekrutNama('');
      setKaderPerekrutJabatan('Pengurus DPW/DPD NasDem');
      setKaderPerekrutKodeReferral('');
      setKaderPerekrutNik('');
      setKetuaLangsungInfo(null);
      setRefValidation(null);
      setErrorMsg(null);
    }
  }, [isOpen, defaultDpd, defaultDpc, defaultDprt, defaultTingkat, defaultWilayahPenugasan]);

  const currentRegion = SULUT_REGIONS.find((r) => r.name === dpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];
  const currentSubdistrict = availableSubdistricts.find((s) => isDpcMatch(s.name, dpc));
  const availableVillages = currentSubdistrict ? currentSubdistrict.villages : [];

  const cleanedNik = useMemo(() => nik.replace(/[^0-9]/g, '').trim(), [nik]);
  const nikDecoded = useMemo(() => decodeIndonesianNik(cleanedNik), [cleanedNik]);

  useEffect(() => {
    if (cleanedNik.length === 16 && nikDecoded.isValidFormat) {
      if (!tanggalLahir && nikDecoded.tanggalLahir) {
        setTanggalLahir(nikDecoded.tanggalLahir);
      }
      if (!jenisKelamin && nikDecoded.jenisKelamin) {
        setJenisKelamin(nikDecoded.jenisKelamin);
      }
      if (!isDpdLocked && nikDecoded.dpdName) {
        setDpd(nikDecoded.dpdName);
      }
    }
  }, [cleanedNik, nikDecoded, tanggalLahir, jenisKelamin, isDpdLocked]);

  const duplicateMember = useMemo(() => {
    if (!cleanedNik) return null;
    return existingMembers.find((m) => {
      const mClean = (m.nik || '').replace(/[^0-9]/g, '').trim();
      return mClean === cleanedNik || m.nik === cleanedNik;
    }) || null;
  }, [cleanedNik, existingMembers]);

  useEffect(() => {
    if (isPengurus && !kodeReferral && cleanedNik.length >= 4) {
      const code = `REF-${tingkatKepengurusan}-${cleanedNik.slice(-4)}`;
      setKodeReferral(code);
    } else if (!isPengurus) {
      setKodeReferral('');
    }
  }, [isPengurus, tingkatKepengurusan, cleanedNik, kodeReferral]);

  useEffect(() => {
    if (!dpc && availableSubdistricts.length > 0) {
      setDpc(availableSubdistricts[0].name);
    }
  }, [dpd, dpc, availableSubdistricts]);

  if (!isOpen) return null;

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
      e.target.value = '';
    }
  };

  const handleKtpScanComplete = (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => {
    setErrorMsg(null);
    setOcrTerritoryNotice(null);
    setFotoKtpUrl(result.fotoKtpUrl);
    setKtpQualityReport(result.quality);
    setKtpExtractedData(result.extracted);

    if (result.croppedFaceDataUrl && !fotoProfilUrl) {
      setFotoProfilUrl(result.croppedFaceDataUrl);
    }

    const ext = result.extracted;
    const extNikDecoded = decodeIndonesianNik(ext.nik);
    if (ext.nik) setNik(ext.nik);
    if (ext.namaLengkap) setNamaLengkap(ext.namaLengkap);
    if (ext.tempatLahir) setTempatLahir(ext.tempatLahir);
    if (ext.tanggalLahir) setTanggalLahir(ext.tanggalLahir);
    if (ext.jenisKelamin) setJenisKelamin(ext.jenisKelamin);
    if (ext.agama) setAgama(ext.agama);
    if (ext.pekerjaan) setPekerjaan(ext.pekerjaan);
    if (ext.alamatLengkap) setAlamatLengkap(ext.alamatLengkap);

    const targetDpd = ext.matchedDpd || extNikDecoded.dpdName;
    if (targetDpd) {
      if (isDpdLocked && !isDpdMatch(targetDpd, canonicalDpd)) {
        setOcrTerritoryNotice(
          `KTP terdeteksi wilayah "${targetDpd}", namun akun Anda dikunci untuk wilayah "${canonicalDpd}". Wilayah penugasan tetap menggunakan ${canonicalDpd}.`
        );
      } else if (!isDpdLocked) {
        setDpd(targetDpd);
        const reg = SULUT_REGIONS.find((r) => r.name === targetDpd);
        if (ext.matchedDpc && reg?.subdistricts.some((s) => s.name === ext.matchedDpc)) {
          setDpc(ext.matchedDpc);
        } else if (reg && reg.subdistricts.length > 0) {
          setDpc(reg.subdistricts[0].name);
        }
      }
    }

    if (!isDpcLocked && ext.matchedDpc) {
      setDpc(ext.matchedDpc);
    }

    if (!isDprtLocked && (ext.matchedDprt || ext.kelDesa)) {
      setDprt(ext.matchedDprt || ext.kelDesa);
    }

    setStep(2);
  };

  const validateStep2 = (): boolean => {
    setErrorMsg(null);
    if (cleanedNik.length !== 16) {
      setErrorMsg(`NIK wajib 16 digit angka sesuai e-KTP (saat ini ${cleanedNik.length} digit).`);
      return false;
    }
    if (duplicateMember) {
      setErrorMsg(
        `NIK ${cleanedNik} sudah terdaftar atas nama "${duplicateMember.namaLengkap}" (${duplicateMember.dpd}). Duplikasi data ditolak.`
      );
      return false;
    }
    if (!namaLengkap.trim() || namaLengkap.trim().length < 3) {
      setErrorMsg('Nama Lengkap sesuai e-KTP wajib diisi minimal 3 karakter.');
      return false;
    }
    if (!jenisKelamin) {
      setErrorMsg('Pilih Jenis Kelamin (Laki-laki / Perempuan).');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setErrorMsg(null);
    const finalDpd = isDpdLocked ? canonicalDpd : dpd;
    const finalDpc = isDpcLocked ? defaultDpc : dpc;
    const finalDprt = isDprtLocked ? defaultDprt : dprt.trim();

    if (!finalDpd) {
      setErrorMsg('Pilih Kabupaten / Kota (DPD).');
      return false;
    }
    if (!finalDpc) {
      setErrorMsg('Pilih Kecamatan (DPC).');
      return false;
    }
    if (!finalDprt) {
      setErrorMsg('Kelurahan / Desa (DPRt) wajib diisi.');
      return false;
    }

    if (isDpdLocked && !isDpdMatch(finalDpd, canonicalDpd)) {
      setErrorMsg(`Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di wilayah ${canonicalDpd}.`);
      return false;
    }
    if (isDpcLocked && !isDpcMatch(finalDpc, defaultDpc)) {
      setErrorMsg(`Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kecamatan ${defaultDpc}.`);
      return false;
    }
    if (isDprtLocked && !isDprtMatch(finalDprt, defaultDprt)) {
      setErrorMsg(`Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kelurahan/desa ${defaultDprt}.`);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step > 1) setStep((prev) => (prev - 1) as WizardStepNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) {
      handleNextStep();
      return;
    }
    if (!validateStep2() || !validateStep3()) return;

    const finalDpd = isDpdLocked ? canonicalDpd : dpd;
    const finalDpc = isDpcLocked ? defaultDpc : (dpc || 'Umum');
    const finalDprt = isDprtLocked ? defaultDprt : (dprt.trim() || 'Umum');

    const newMember: Member = {
      nik: cleanedNik,
      nomorEKTA: cleanedNik,
      autoRegisterDpp,
      namaLengkap: namaLengkap.trim(),
      jenisKelamin: jenisKelamin || undefined,
      tempatLahir: tempatLahir.trim() || undefined,
      tanggalLahir: tanggalLahir.trim() || undefined,
      agama: agama.trim() || undefined,
      pekerjaan: pekerjaan.trim() || undefined,
      alamatLengkap: alamatLengkap.trim() || undefined,
      nomorHP: nomorHP.trim() || '-',
      email: email.trim() || undefined,
      sosmed: sosmed.trim() || undefined,
      dpd: finalDpd,
      dpc: finalDpc,
      dprt: finalDprt,
      isPengurus,
      tingkatKepengurusan: isPengurus ? tingkatKepengurusan : 'Bukan Pengurus',
      wilayahPenugasan: isPengurus ? wilayahPenugasan.trim() : `DPRt ${finalDprt}, Kec. ${finalDpc}, ${finalDpd}`,
      nomorSK: isPengurus && nomorSK.trim() ? nomorSK.trim() : undefined,
      tanggalSK: isPengurus && tanggalSK.trim() ? tanggalSK.trim() : undefined,
      kodeReferral: isPengurus ? kodeReferral.trim() : undefined,
      jabatan: isPengurus ? jabatan : 'Anggota / Kader Biasa',
      status,
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: catatanMutasi.trim() || 'Registrasi kader baru via Smart e-KTP Scanner DPW Sulut',
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
      fotoProfilUrl: fotoProfilUrl || undefined,
      fotoKtpUrl: fotoKtpUrl || undefined,
      statusKtpVerified: Boolean(fotoKtpUrl),
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-5 animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full h-dvh sm:h-auto sm:max-h-[92vh] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1A3282] text-white flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Pendaftaran Anggota Baru
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  DPW Partai NasDem Sulawesi Utara · Scan Kamera / Upload e-KTP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
              title="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <RegistrationStepProgressBar
            currentStep={step}
            onSelectStep={(targetStep) => {
              if (targetStep < step) setStep(targetStep);
              else if (targetStep === 2 && step === 1) setStep(2);
              else if (targetStep === 3 && step === 2 && validateStep2()) setStep(3);
              else if (targetStep === 4 && step === 3 && validateStep3()) setStep(4);
            }}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {ocrTerritoryNotice && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{ocrTerritoryNotice}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <KtpCameraScannerBox
                  fotoKtpUrl={fotoKtpUrl}
                  qualityReport={ktpQualityReport}
                  extractedData={ktpExtractedData}
                  onScanComplete={handleKtpScanComplete}
                  onClearKtp={() => {
                    setFotoKtpUrl('');
                    setKtpQualityReport(null);
                    setKtpExtractedData(null);
                  }}
                  onProceedNext={() => setStep(2)}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jika calon anggota belum membawa fisik KTP saat ini, Anda dapat mengisi manual pada Tahap 2.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-white w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Isi Manual Tanpa Foto KTP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <RegistrationStep2Identity
                fotoKtpUrl={fotoKtpUrl}
                fotoProfilUrl={fotoProfilUrl}
                onRescanKtp={() => setStep(1)}
                onUploadProfilePhoto={handlePhotoUpload}
                onClearProfilePhoto={() => setFotoProfilUrl('')}
                isUploadingPhoto={isUploadingPhoto}
                nik={nik}
                onChangeNik={setNik}
                cleanNik={cleanedNik}
                duplicateMember={duplicateMember}
                nikDecodedInfo={nikDecoded}
                namaLengkap={namaLengkap}
                onChangeNamaLengkap={setNamaLengkap}
                tempatLahir={tempatLahir}
                onChangeTempatLahir={setTempatLahir}
                tanggalLahir={tanggalLahir}
                onChangeTanggalLahir={setTanggalLahir}
                jenisKelamin={jenisKelamin}
                onChangeJenisKelamin={setJenisKelamin}
                agama={agama}
                onChangeAgama={setAgama}
                pekerjaan={pekerjaan}
                onChangePekerjaan={setPekerjaan}
              />
            )}

            {step === 3 && (
              <RegistrationStep3AddressContact
                alamatLengkap={alamatLengkap}
                onChangeAlamatLengkap={setAlamatLengkap}
                dpd={dpd}
                onChangeDpd={(val) => {
                  setDpd(val);
                  const region = SULUT_REGIONS.find((r) => r.name === val);
                  if (region && region.subdistricts.length > 0) {
                    setDpc(region.subdistricts[0].name);
                  }
                }}
                isDpdLocked={isDpdLocked}
                lockedDpdLabel={canonicalDpd}
                dpc={dpc}
                onChangeDpc={setDpc}
                isDpcLocked={isDpcLocked}
                lockedDpcLabel={defaultDpc}
                availableSubdistricts={availableSubdistricts}
                dprt={dprt}
                onChangeDprt={setDprt}
                isDprtLocked={isDprtLocked}
                lockedDprtLabel={defaultDprt}
                availableVillages={availableVillages}
                nomorHP={nomorHP}
                onChangeNomorHP={setNomorHP}
                email={email}
                onChangeEmail={setEmail}
                sosmed={sosmed}
                onChangeSosmed={setSosmed}
                showAdminPartyFields={true}
                isPengurus={isPengurus}
                onChangeIsPengurus={(checked) => {
                  setIsPengurus(checked);
                  setJabatan(checked ? 'Pengurus DPW NasDem' : 'Anggota / Kader Biasa');
                }}
                tingkatKepengurusan={tingkatKepengurusan}
                onChangeTingkatKepengurusan={setTingkatKepengurusan}
                allowedTingkatOptions={allowedTingkatOptions}
                jabatan={jabatan}
                onChangeJabatan={setJabatan}
                nomorSK={nomorSK}
                onChangeNomorSK={setNomorSK}
                kodeReferral={kodeReferral}
                onChangeKodeReferral={setKodeReferral}
                kaderPerekrutKodeReferral={kaderPerekrutKodeReferral}
                onChangeKaderPerekrutKodeReferral={setKaderPerekrutKodeReferral}
                kaderPerekrutNama={kaderPerekrutNama}
                onChangeKaderPerekrutNama={setKaderPerekrutNama}
                kaderPerekrutJabatan={kaderPerekrutJabatan}
                onChangeKaderPerekrutJabatan={setKaderPerekrutJabatan}
                refValidation={refValidation}
                ketuaLangsungInfo={ketuaLangsungInfo}
              />
            )}

            {step === 4 && (
              <RegistrationStep4Summary
                cleanNik={cleanedNik}
                namaLengkap={namaLengkap}
                tempatLahir={tempatLahir}
                tanggalLahir={tanggalLahir}
                jenisKelamin={jenisKelamin}
                agama={agama}
                pekerjaan={pekerjaan}
                alamatLengkap={alamatLengkap}
                dpd={isDpdLocked ? canonicalDpd : dpd}
                dpc={isDpcLocked ? defaultDpc : dpc}
                dprt={isDprtLocked ? defaultDprt : dprt}
                nomorHP={nomorHP}
                email={email}
                sosmed={sosmed}
                fotoProfilUrl={fotoProfilUrl}
                fotoKtpUrl={fotoKtpUrl}
                ktpQualityReport={ktpQualityReport}
                roleBadgeText={isPengurus ? `${jabatan} (${tingkatKepengurusan})` : 'Anggota / Kader Biasa'}
                recruiterLabel={
                  kaderPerekrutNama
                    ? `${kaderPerekrutNama} (${kaderPerekrutKodeReferral || 'Referral'})`
                    : undefined
                }
                autoRegisterDpp={autoRegisterDpp}
                onToggleAutoRegisterDpp={setAutoRegisterDpp}
                onEditStep2={() => setStep(2)}
                onEditStep3={() => setStep(3)}
              />
            )}
          </div>

          {/* Wizard Footer Navigation */}
          <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2.5">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn-white px-3.5 sm:px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-white px-4 py-2.5 text-xs font-medium rounded-xl cursor-pointer shrink-0"
              >
                Batal
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white shadow-2xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Lanjut ke Tahap {step + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white shadow-2xs cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Simpan & Daftarkan Anggota</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
