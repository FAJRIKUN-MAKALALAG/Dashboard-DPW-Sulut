import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Member, UserSession, DirectLeaderInfo } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';
import {
  KtpCameraScannerBox,
  KtpImageQualityReport,
  ExtractedKtpData,
  decodeIndonesianNik,
} from '../../ktp-scanner';
import { compressImageFile } from '../../utils/imageUtils';
import {
  RegistrationStepProgressBar,
  WizardStepNumber,
} from '../member-registration/RegistrationStepProgressBar';
import { RegistrationStep2Identity } from '../member-registration/RegistrationStep2Identity';
import { RegistrationStep3AddressContact } from '../member-registration/RegistrationStep3AddressContact';
import { RegistrationStep4Summary } from '../member-registration/RegistrationStep4Summary';

interface PengurusRegisterMemberFormProps {
  members: Member[];
  session: UserSession;
  activePengurusMember: Member | null;
  myReferralCode: string;
  ketuaLangsung: DirectLeaderInfo | null;
  onAddMember: (newMember: Member) => void | Promise<any>;
  perekrutNama: string;
  perekrutJabatan: string;
  perekrutNik?: string;
}

export const PengurusRegisterMemberForm: React.FC<PengurusRegisterMemberFormProps> = ({
  members,
  session,
  activePengurusMember,
  myReferralCode,
  ketuaLangsung,
  onAddMember,
  perekrutNama,
  perekrutJabatan,
  perekrutNik,
}) => {
  // 1. DPD Locking & Resolution
  const rawUserDpd =
    (session.dpdAccess && session.dpdAccess !== 'ALL' ? session.dpdAccess : null) ||
    (activePengurusMember?.dpd && activePengurusMember.dpd !== '-' ? activePengurusMember.dpd : '');

  const matchedDpdRegion = useMemo(() => {
    if (!rawUserDpd) return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, rawUserDpd)) || null;
  }, [rawUserDpd]);

  const canonicalDpdName = matchedDpdRegion
    ? matchedDpdRegion.name
    : rawUserDpd || SULUT_REGIONS[0].name;

  const isDpdLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    Boolean(rawUserDpd);

  const lockedDpdName = isDpdLocked ? canonicalDpdName : '';

  // 2. DPC Locking & Resolution
  const rawUserDpc =
    (session.dpcAccess &&
    session.dpcAccess !== 'ALL' &&
    session.dpcAccess !== 'Umum (DPD)' &&
    session.dpcAccess !== '-'
      ? session.dpcAccess
      : null) ||
    (activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? activePengurusMember.dpc : '');

  const isDpcRoleOrLevel =
    session.role === 'ADMIN_DPC' ||
    session.role === 'ADMIN_DPRT' ||
    activePengurusMember?.tingkatKepengurusan === 'DPC' ||
    activePengurusMember?.tingkatKepengurusan === 'DPRt';

  const isDpcLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    isDpcRoleOrLevel &&
    Boolean(rawUserDpc);

  const matchedSubdistrict = useMemo(() => {
    if (!rawUserDpc || !matchedDpdRegion) return null;
    return matchedDpdRegion.subdistricts.find((s) => isDpcMatch(s.name, rawUserDpc)) || null;
  }, [rawUserDpc, matchedDpdRegion]);

  const canonicalDpcName = matchedSubdistrict ? matchedSubdistrict.name : rawUserDpc;
  const lockedDpcName = isDpcLocked ? canonicalDpcName : '';

  // 3. DPRt Locking & Resolution
  const rawUserDprt =
    (session.dprtAccess &&
    session.dprtAccess !== 'ALL' &&
    session.dprtAccess !== 'Pusat/Umum' &&
    session.dprtAccess !== '-'
      ? session.dprtAccess
      : null) ||
    (activePengurusMember?.dprt && activePengurusMember.dprt !== '-'
      ? activePengurusMember.dprt
      : '');

  const isDprtRoleOrLevel =
    session.role === 'ADMIN_DPRT' || activePengurusMember?.tingkatKepengurusan === 'DPRt';

  const isDprtLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    isDprtRoleOrLevel &&
    Boolean(rawUserDprt);

  const lockedDprtName = isDprtLocked ? rawUserDprt : '';

  const defaultDpd = isDpdLocked ? lockedDpdName : canonicalDpdName;
  const defaultDpc = isDpcLocked
    ? lockedDpcName
    : matchedDpdRegion?.subdistricts[0]?.name || activePengurusMember?.dpc || '';
  const defaultDprt = isDprtLocked ? lockedDprtName : activePengurusMember?.dprt || '';

  const [currentStep, setCurrentStep] = useState<WizardStepNumber>(1);

  // State Tahap 1 & 2
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string>('');
  const [fotoProfilUrl, setFotoProfilUrl] = useState<string>('');
  const [ktpQualityReport, setKtpQualityReport] = useState<KtpImageQualityReport | null>(null);
  const [extractedKtpData, setExtractedKtpData] = useState<ExtractedKtpData | null>(null);

  const [inputNik, setInputNik] = useState<string>('');
  const [inputNama, setInputNama] = useState<string>('');
  const [inputTempatLahir, setInputTempatLahir] = useState<string>('');
  const [inputTanggalLahir, setInputTanggalLahir] = useState<string>('');
  const [inputJenisKelamin, setInputJenisKelamin] = useState<'Laki-laki' | 'Perempuan' | ''>('');
  const [inputAgama, setInputAgama] = useState<string>('Kristen Protestan');
  const [inputPekerjaan, setInputPekerjaan] = useState<string>('');

  // State Tahap 3
  const [inputAlamat, setInputAlamat] = useState<string>('');
  const [inputDpd, setInputDpd] = useState<string>(defaultDpd);
  const [inputDpc, setInputDpc] = useState<string>(defaultDpc);
  const [inputDprt, setInputDprt] = useState<string>(defaultDprt);
  const [inputHp, setInputHp] = useState<string>('');
  const [inputEmail, setInputEmail] = useState<string>('');
  const [inputSosmed, setInputSosmed] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [autoRegisterDpp, setAutoRegisterDpp] = useState<boolean>(true);

  useEffect(() => {
    if (isDpdLocked) setInputDpd(lockedDpdName);
    else if (defaultDpd) setInputDpd(defaultDpd);
  }, [isDpdLocked, lockedDpdName, defaultDpd]);

  const effectiveDpd = isDpdLocked ? lockedDpdName : inputDpd;
  const currentRegion = useMemo(() => {
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, effectiveDpd)) || SULUT_REGIONS[0];
  }, [effectiveDpd]);

  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  useEffect(() => {
    if (isDpcLocked) {
      setInputDpc(lockedDpcName);
    } else if (availableSubdistricts.length > 0) {
      const match = availableSubdistricts.some((s) => isDpcMatch(s.name, inputDpc));
      if (!match) setInputDpc(availableSubdistricts[0].name);
    }
  }, [isDpcLocked, lockedDpcName, availableSubdistricts, inputDpc]);

  useEffect(() => {
    if (isDprtLocked) setInputDprt(lockedDprtName);
  }, [isDprtLocked, lockedDprtName]);

  const effectiveDpc = isDpcLocked ? lockedDpcName : inputDpc;
  const currentSubdistrict = useMemo(() => {
    return availableSubdistricts.find((s) => isDpcMatch(s.name, effectiveDpc)) || null;
  }, [availableSubdistricts, effectiveDpc]);

  const availableVillages = currentSubdistrict ? currentSubdistrict.villages : [];

  const cleanNik = useMemo(() => inputNik.replace(/[^0-9]/g, '').trim(), [inputNik]);
  const nikDecoded = useMemo(() => decodeIndonesianNik(cleanNik), [cleanNik]);

  const duplicateMember = useMemo(() => {
    if (cleanNik.length !== 16) return null;
    return members.find((m) => (m.nik || '').replace(/[^0-9]/g, '').trim() === cleanNik) || null;
  }, [cleanNik, members]);

  useEffect(() => {
    if (cleanNik.length === 16 && nikDecoded.isValidFormat) {
      if (!inputTanggalLahir && nikDecoded.tanggalLahir) {
        setInputTanggalLahir(nikDecoded.tanggalLahir);
      }
      if (!inputJenisKelamin && nikDecoded.jenisKelamin) {
        setInputJenisKelamin(nikDecoded.jenisKelamin);
      }
      if (!inputTempatLahir && nikDecoded.tempatLahirSuggestion) {
        setInputTempatLahir(nikDecoded.tempatLahirSuggestion);
      }
      if (!isDpdLocked && nikDecoded.dpdName) {
        const matchedReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, nikDecoded.dpdName));
        if (matchedReg) setInputDpd(matchedReg.name);
      }
    }
  }, [cleanNik, nikDecoded, inputTanggalLahir, inputJenisKelamin, inputTempatLahir, isDpdLocked]);

  const handleApplyNikDecoderManually = () => {
    if (!nikDecoded.isValidFormat) {
      setFormError('Pastikan NIK berjumlah 16 digit angka yang valid terlebih dahulu.');
      return;
    }
    setFormError(null);
    if (nikDecoded.tanggalLahir) setInputTanggalLahir(nikDecoded.tanggalLahir);
    if (nikDecoded.jenisKelamin) setInputJenisKelamin(nikDecoded.jenisKelamin);
    if (nikDecoded.tempatLahirSuggestion && !inputTempatLahir) {
      setInputTempatLahir(nikDecoded.tempatLahirSuggestion);
    }
    if (!isDpdLocked && nikDecoded.dpdName) {
      const matchedReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, nikDecoded.dpdName));
      if (matchedReg) setInputDpd(matchedReg.name);
    }
  };

  const handleScanComplete = (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => {
    setFormError(null);
    setFormSuccess(null);
    setFotoKtpUrl(result.fotoKtpUrl);
    if (result.croppedFaceDataUrl && !fotoProfilUrl) {
      setFotoProfilUrl(result.croppedFaceDataUrl);
    }
    setKtpQualityReport(result.quality);
    setExtractedKtpData(result.extracted);

    const ext = result.extracted;
    if (ext.nik) setInputNik(ext.nik);
    if (ext.namaLengkap) setInputNama(ext.namaLengkap);
    if (ext.tempatLahir) setInputTempatLahir(ext.tempatLahir);
    if (ext.tanggalLahir) setInputTanggalLahir(ext.tanggalLahir);
    if (ext.jenisKelamin) setInputJenisKelamin(ext.jenisKelamin);
    if (ext.agama) setInputAgama(ext.agama);
    if (ext.pekerjaan) setInputPekerjaan(ext.pekerjaan);
    if (ext.alamatLengkap) setInputAlamat(ext.alamatLengkap);

    if (!isDpdLocked && ext.matchedDpd) setInputDpd(ext.matchedDpd);
    if (!isDpcLocked && ext.matchedDpc) setInputDpc(ext.matchedDpc);
    if (!isDprtLocked && (ext.matchedDprt || ext.kelDesa)) {
      setInputDprt(ext.matchedDprt || ext.kelDesa);
    }

    setOcrNotice(
      'Data e-KTP telah diekstrak ke formulir. Silakan periksa & koreksi di Tahap 2 jika ada huruf yang perlu disesuaikan.'
    );
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.82);
      setFotoProfilUrl(compressed);
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  const validateStep2 = (): boolean => {
    setFormError(null);
    if (cleanNik.length !== 16) {
      setFormError(`Nomor NIK wajib 16 digit angka (saat ini ${cleanNik.length} digit).`);
      return false;
    }
    if (duplicateMember) {
      setFormError(
        `NIK ${cleanNik} sudah terdaftar atas nama "${duplicateMember.namaLengkap}" (${duplicateMember.dpd}).`
      );
      return false;
    }
    if (!inputNama.trim()) {
      setFormError('Nama lengkap calon anggota sesuai KTP wajib diisi.');
      return false;
    }
    if (!inputJenisKelamin) {
      setFormError('Silakan pilih Jenis Kelamin calon anggota.');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setFormError(null);
    const finalDpd = isDpdLocked ? lockedDpdName : inputDpd;
    const finalDpc = isDpcLocked ? lockedDpcName : inputDpc || 'Umum';
    const finalDprt = isDprtLocked ? lockedDprtName : inputDprt.trim() || 'Umum';

    if (isDpdLocked && !isDpdMatch(finalDpd, lockedDpdName)) {
      setFormError(`Hak Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di wilayah ${lockedDpdName}.`);
      return false;
    }
    if (isDpcLocked && !isDpcMatch(finalDpc, lockedDpcName)) {
      setFormError(`Hak Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kecamatan ${lockedDpcName}.`);
      return false;
    }
    if (isDprtLocked && !isDprtMatch(finalDprt, lockedDprtName)) {
      setFormError(`Hak Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kelurahan/desa ${lockedDprtName}.`);
      return false;
    }
    if (!inputAlamat.trim()) {
      setFormError('Alamat lengkap domisili wajib diisi.');
      return false;
    }
    return true;
  };

  const handleGoToStep = (targetStep: WizardStepNumber) => {
    setFormError(null);
    if (targetStep === 3 && !validateStep2()) return;
    if (targetStep === 4) {
      if (!validateStep2()) {
        setCurrentStep(2);
        return;
      }
      if (!validateStep3()) {
        setCurrentStep(3);
        return;
      }
    }
    setCurrentStep(targetStep);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    const finalDpd = isDpdLocked ? lockedDpdName : inputDpd;
    const finalDpc = isDpcLocked ? lockedDpcName : inputDpc || 'Umum';
    const finalDprt = isDprtLocked ? lockedDprtName : inputDprt.trim() || 'Umum';

    setIsSubmitting(true);
    setFormError(null);

    const newMember: Member = {
      nik: cleanNik,
      nomorEKTA: cleanNik,
      autoRegisterDpp,
      namaLengkap: inputNama.trim(),
      jenisKelamin: inputJenisKelamin || undefined,
      tempatLahir: inputTempatLahir.trim() || undefined,
      tanggalLahir: inputTanggalLahir || undefined,
      agama: inputAgama || undefined,
      pekerjaan: inputPekerjaan.trim() || undefined,
      alamatLengkap: inputAlamat.trim() || undefined,
      nomorHP: inputHp.trim() || '-',
      email: inputEmail.trim() || undefined,
      sosmed: inputSosmed.trim() || undefined,
      dpd: finalDpd,
      dpc: finalDpc,
      dprt: finalDprt,
      fotoKtpUrl: fotoKtpUrl || undefined,
      fotoProfilUrl: fotoProfilUrl || undefined,
      statusKtpVerified: Boolean(fotoKtpUrl),
      isPengurus: false,
      tingkatKepengurusan: 'Bukan Pengurus',
      jabatan: 'Anggota Biasa',
      status: 'Aktif',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: `Perekrutan mandiri via Scan e-KTP oleh ${perekrutNama} (${perekrutJabatan})`,
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
      kaderPerekrutKodeReferral: myReferralCode,
      kaderPerekrutNama: perekrutNama,
      kaderPerekrutJabatan: perekrutJabatan,
      kaderPerekrutNik: perekrutNik,
      kaderPerekrutDpd: finalDpd,
      ketuaLangsungNik: ketuaLangsung?.nik || undefined,
      ketuaLangsungNama: ketuaLangsung?.nama || undefined,
      ketuaLangsungJabatan: ketuaLangsung?.jabatan || undefined,
      ketuaLangsungTingkat: ketuaLangsung?.tingkat || undefined,
    };

    try {
      const res: any = await onAddMember(newMember);
      const officialEkta = res?.officialEkta;
      if (officialEkta && officialEkta !== cleanNik) {
        setFormSuccess(
          `Kader "${newMember.namaLengkap}" berhasil didaftarkan! Nomor e-KTA DPP Resmi (${officialEkta}) berhasil diterbitkan di wilayah ${newMember.dpd} (${newMember.dpc}).`
        );
      } else {
        setFormSuccess(
          `Kader "${newMember.namaLengkap}" (NIK: ${newMember.nik}) berhasil didaftarkan lengkap beserta data e-KTP di wilayah ${newMember.dpd} (${newMember.dpc})!`
        );
      }

      setFotoKtpUrl('');
      setFotoProfilUrl('');
      setKtpQualityReport(null);
      setExtractedKtpData(null);
      setOcrNotice(null);
      setInputNik('');
      setInputNama('');
      setInputTempatLahir('');
      setInputTanggalLahir('');
      setInputJenisKelamin('');
      setInputAgama('Kristen Protestan');
      setInputPekerjaan('');
      setInputAlamat('');
      setInputHp('');
      setInputEmail('');
      setInputSosmed('');
      if (!isDprtLocked) setInputDprt('');
      setCurrentStep(1);
    } catch (err: any) {
      setFormError(`Gagal mendaftarkan kader: ${err?.message || err || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 md:p-6 shadow-2xs space-y-4 sm:space-y-5">
      {/* Header Judul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A3282] text-white flex items-center justify-center shrink-0 mt-0.5">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Pendaftaran Anggota Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pindai e-KTP calon kader melalui kamera atau unggah berkas, lalu verifikasi data bertahap.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold shrink-0 self-start sm:self-auto">
          {isDpdLocked ? (
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>
            {isDpdLocked
              ? `Wilayah: ${lockedDpdName}${isDpcLocked ? ` › ${lockedDpcName}` : ''}`
              : 'Cakupan: Seluruh Sulawesi Utara'}
          </span>
        </div>
      </div>

      <RegistrationStepProgressBar
        currentStep={currentStep}
        onSelectStep={handleGoToStep}
      />

      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormSuccess(null)}
            className="text-[11px] underline cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <KtpCameraScannerBox
            fotoKtpUrl={fotoKtpUrl}
            qualityReport={ktpQualityReport}
            extractedData={extractedKtpData}
            onScanComplete={handleScanComplete}
            onClearKtp={() => {
              setFotoKtpUrl('');
              setKtpQualityReport(null);
              setExtractedKtpData(null);
              setOcrNotice(null);
            }}
            onProceedNext={() => setCurrentStep(2)}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500">
              {fotoKtpUrl
                ? 'Foto e-KTP sudah siap. Lanjutkan ke Tahap 2 untuk memeriksa data.'
                : 'Jika calon anggota belum membawa fisik KTP, Anda dapat mengisi manual.'}
            </span>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-white w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{fotoKtpUrl ? 'Lanjut ke Tahap 2' : 'Isi Manual Tanpa Foto KTP'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {ocrNotice && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ocrNotice}</span>
            </div>
          )}

          <RegistrationStep2Identity
            fotoKtpUrl={fotoKtpUrl}
            fotoProfilUrl={fotoProfilUrl}
            onRescanKtp={() => setCurrentStep(1)}
            onUploadProfilePhoto={handleProfilePhotoUpload}
            onClearProfilePhoto={() => setFotoProfilUrl('')}
            nik={inputNik}
            onChangeNik={setInputNik}
            cleanNik={cleanNik}
            duplicateMember={duplicateMember}
            nikDecodedInfo={nikDecoded}
            onSyncNikDecoder={handleApplyNikDecoderManually}
            namaLengkap={inputNama}
            onChangeNamaLengkap={setInputNama}
            tempatLahir={inputTempatLahir}
            onChangeTempatLahir={setInputTempatLahir}
            tanggalLahir={inputTanggalLahir}
            onChangeTanggalLahir={setInputTanggalLahir}
            jenisKelamin={inputJenisKelamin}
            onChangeJenisKelamin={setInputJenisKelamin}
            agama={inputAgama}
            onChangeAgama={setInputAgama}
            pekerjaan={inputPekerjaan}
            onChangePekerjaan={setInputPekerjaan}
          />

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-white px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={() => handleGoToStep(3)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>Lanjut ke Tahap 3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <RegistrationStep3AddressContact
            alamatLengkap={inputAlamat}
            onChangeAlamatLengkap={setInputAlamat}
            dpd={effectiveDpd}
            onChangeDpd={(val) => {
              setInputDpd(val);
              const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, val));
              if (reg && reg.subdistricts.length > 0) {
                setInputDpc(reg.subdistricts[0].name);
              }
            }}
            isDpdLocked={isDpdLocked}
            lockedDpdLabel={lockedDpdName}
            dpc={effectiveDpc}
            onChangeDpc={setInputDpc}
            isDpcLocked={isDpcLocked}
            lockedDpcLabel={lockedDpcName}
            availableSubdistricts={availableSubdistricts}
            dprt={inputDprt}
            onChangeDprt={setInputDprt}
            isDprtLocked={isDprtLocked}
            lockedDprtLabel={lockedDprtName}
            availableVillages={availableVillages}
            nomorHP={inputHp}
            onChangeNomorHP={setInputHp}
            email={inputEmail}
            onChangeEmail={setInputEmail}
            sosmed={inputSosmed}
            onChangeSosmed={setInputSosmed}
          />

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-white px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={() => handleGoToStep(4)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
            >
              <span>Lanjut ke Konfirmasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in duration-150">
          <RegistrationStep4Summary
            cleanNik={cleanNik}
            namaLengkap={inputNama}
            tempatLahir={inputTempatLahir}
            tanggalLahir={inputTanggalLahir}
            jenisKelamin={inputJenisKelamin}
            agama={inputAgama}
            pekerjaan={inputPekerjaan}
            alamatLengkap={inputAlamat}
            dpd={effectiveDpd}
            dpc={effectiveDpc}
            dprt={(isDprtLocked ? lockedDprtName : inputDprt) || 'Umum'}
            nomorHP={inputHp}
            email={inputEmail}
            sosmed={inputSosmed}
            fotoProfilUrl={fotoProfilUrl}
            fotoKtpUrl={fotoKtpUrl}
            ktpQualityReport={ktpQualityReport}
            roleBadgeText="Anggota / Kader Biasa"
            recruiterLabel={`${perekrutNama} (${myReferralCode || 'Pengurus'})`}
            autoRegisterDpp={autoRegisterDpp}
            onToggleAutoRegisterDpp={setAutoRegisterDpp}
            onEditStep2={() => setCurrentStep(2)}
            onEditStep3={() => setCurrentStep(3)}
          />

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn-white px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Menyimpan Data...' : 'Simpan & Daftarkan Anggota'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
