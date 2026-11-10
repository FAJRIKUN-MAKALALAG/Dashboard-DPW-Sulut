import React, { useState, useEffect, useMemo } from 'react';
import { Member, MemberStatus, UserSession } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { compressImageFile, generateSimulatedKtp } from '../utils/imageUtils';
import {
  Edit3,
  X,
  AlertCircle,
  CheckCircle2,
  User,
  Save,
} from 'lucide-react';
import { referralService } from '../services/referralService';
import { EditMemberPhotoKtpSection } from './edit-member/EditMemberPhotoKtpSection';
import { EditMemberPartyReferralSection } from './edit-member/EditMemberPartyReferralSection';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMember: Member, originalNik: string) => void;
  member: Member | null;
  existingMembers: Member[];
  session: UserSession;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  member,
  existingMembers,
  session,
}) => {
  const originalNik = member?.nik || '';
  const originalCleanNik = originalNik.replace(/[^0-9]/g, '').trim();

  const [nik, setNik] = useState<string>(member?.nik || '');
  const [nomorEKTA, setNomorEKTA] = useState<string>(member?.nomorEKTA || '');
  const [namaLengkap, setNamaLengkap] = useState<string>(member?.namaLengkap || '');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan' | ''>(
    (member?.jenisKelamin as 'Laki-laki' | 'Perempuan' | '') || ''
  );
  const [tempatLahir, setTempatLahir] = useState<string>(member?.tempatLahir || '');
  const [tanggalLahir, setTanggalLahir] = useState<string>(member?.tanggalLahir || '');
  const [agama, setAgama] = useState<string>(member?.agama || '');
  const [pekerjaan, setPekerjaan] = useState<string>(member?.pekerjaan || '');
  const [alamatLengkap, setAlamatLengkap] = useState<string>(member?.alamatLengkap || '');
  const [nomorHP, setNomorHP] = useState<string>(member?.nomorHP && member.nomorHP !== '-' ? member.nomorHP : '');
  const [email, setEmail] = useState<string>(member?.email || '');
  const [sosmed, setSosmed] = useState<string>(member?.sosmed || '');
  const [dpd, setDpd] = useState<string>(member?.dpd || SULUT_REGIONS[0].name);
  const [dpc, setDpc] = useState<string>(member?.dpc || '');
  const [dprt, setDprt] = useState<string>(member?.dprt || '');

  const isDpdLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    Boolean(session.dpdAccess && session.dpdAccess !== 'ALL');

  const isDpcLocked =
    (session.role === 'ADMIN_DPC' || session.role === 'ADMIN_DPRT') &&
    Boolean(session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)');

  const isDprtLocked =
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

  const [isPengurus, setIsPengurus] = useState<boolean>(member?.isPengurus ?? true);
  const [tingkatKepengurusan, setTingkatKepengurusan] = useState<'DPW' | 'DPD' | 'DPC' | 'DPRt' | 'Bukan Pengurus'>(
    member?.tingkatKepengurusan || 'DPW'
  );
  const [wilayahPenugasan, setWilayahPenugasan] = useState<string>(member?.wilayahPenugasan || 'DPW Sulawesi Utara');
  const [nomorSK, setNomorSK] = useState<string>(member?.nomorSK || '');
  const [tanggalSK, setTanggalSK] = useState<string>(member?.tanggalSK || '');
  const [kodeReferral, setKodeReferral] = useState<string>(member?.kodeReferral || '');

  const [jabatan, setJabatan] = useState<string>(member?.jabatan || 'Pengurus DPW NasDem');
  const [status, setStatus] = useState<MemberStatus>(member?.status || 'Aktif');
  const [catatanMutasi, setCatatanMutasi] = useState<string>(member?.catatanMutasi || '');
  const [fotoProfilUrl, setFotoProfilUrl] = useState<string>(member?.fotoProfilUrl || '');
  const [fotoKtpUrl, setFotoKtpUrl] = useState<string>(member?.fotoKtpUrl || '');
  const [kaderPerekrutNama, setKaderPerekrutNama] = useState<string>(member?.kaderPerekrutNama || '');
  const [kaderPerekrutJabatan, setKaderPerekrutJabatan] = useState<string>(member?.kaderPerekrutJabatan || 'Pengurus DPW/DPD NasDem');
  const [kaderPerekrutKodeReferral, setKaderPerekrutKodeReferral] = useState<string>(member?.kaderPerekrutKodeReferral || '');
  const [kaderPerekrutNik, setKaderPerekrutNik] = useState<string>('');
  const [ketuaLangsungInfo, setKetuaLangsungInfo] = useState<{ nik: string; nama: string; jabatan: string; tingkat: string } | null>(null);
  const [refValidation, setRefValidation] = useState<{ loading: boolean; valid?: boolean; error?: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isUploadingKtp, setIsUploadingKtp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setNik(member.nik || '');
      setNomorEKTA(member.nomorEKTA || '');
      setNamaLengkap(member.namaLengkap || '');
      setJenisKelamin((member.jenisKelamin as 'Laki-laki' | 'Perempuan' | '') || '');
      setTempatLahir(member.tempatLahir || '');
      setTanggalLahir(member.tanggalLahir || '');
      setAgama(member.agama || '');
      setPekerjaan(member.pekerjaan || '');
      setAlamatLengkap(member.alamatLengkap || '');
      setNomorHP(member.nomorHP && member.nomorHP !== '-' ? member.nomorHP : '');
      setEmail(member.email || '');
      setSosmed(member.sosmed || '');
      setDpd(member.dpd || SULUT_REGIONS[0].name);
      setDpc(member.dpc || '');
      setDprt(member.dprt || '');
      setIsPengurus(member.isPengurus ?? true);
      setTingkatKepengurusan(member.tingkatKepengurusan || 'DPW');
      setWilayahPenugasan(member.wilayahPenugasan || 'DPW Sulawesi Utara');
      setNomorSK(member.nomorSK || '');
      setTanggalSK(member.tanggalSK || '');
      setKodeReferral(member.kodeReferral || '');
      setJabatan(member.jabatan || 'Pengurus DPW NasDem');
      setStatus(member.status || 'Aktif');
      setCatatanMutasi(member.catatanMutasi || '');
      setFotoProfilUrl(member.fotoProfilUrl || '');
      setFotoKtpUrl(member.fotoKtpUrl || '');
      setKaderPerekrutNama(member.kaderPerekrutNama || '');
      setKaderPerekrutJabatan(member.kaderPerekrutJabatan || 'Pengurus DPW/DPD NasDem');
      setKaderPerekrutKodeReferral(member.kaderPerekrutKodeReferral || '');
      setKaderPerekrutNik(member.kaderPerekrutNik || '');
      setKetuaLangsungInfo(
        member.ketuaLangsungNama
          ? {
              nik: member.ketuaLangsungNik || '-',
              nama: member.ketuaLangsungNama,
              jabatan: member.ketuaLangsungJabatan || 'Ketua',
              tingkat: member.ketuaLangsungTingkat || 'DPD',
            }
          : null
      );
      setRefValidation(member.kaderPerekrutKodeReferral ? { loading: false, valid: true } : null);
      setErrorMsg(null);
    }
  }, [member, isOpen]);

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
          if (res.directLeader) setKetuaLangsungInfo(res.directLeader);
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

  const currentRegion = SULUT_REGIONS.find((r) => r.name === dpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  const cleanedNik = useMemo(() => nik.replace(/[^0-9]/g, '').trim(), [nik]);
  const isUnchangedNik = cleanedNik !== '' && cleanedNik === originalCleanNik;

  const duplicateMember = useMemo(() => {
    if (!cleanedNik || isUnchangedNik) return null;
    return existingMembers.find((m) => {
      if (m.nik === originalNik) return false;
      const mClean = (m.nik || '').replace(/[^0-9]/g, '').trim();
      if (mClean === originalCleanNik) return false;
      if (member?.nomorEKTA && m.nomorEKTA === member.nomorEKTA) return false;
      return mClean === cleanedNik;
    });
  }, [cleanedNik, existingMembers, isUnchangedNik, originalNik, originalCleanNik, member]);

  useEffect(() => {
    if (!dpc && availableSubdistricts.length > 0) {
      setDpc(availableSubdistricts[0].name);
    }
  }, [dpd, dpc, availableSubdistricts]);

  if (!isOpen || !member) return null;

  const handleAutoGenerateEkta = () => {
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
      e.target.value = '';
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
      e.target.value = '';
    }
  };

  const handleGenerateSimulatedKtp = () => {
    const simulated = generateSimulatedKtp(
      cleanedNik || member.nik || '7100000000000000',
      namaLengkap || member.namaLengkap,
      dpd,
      dpc || member.dpc,
      dprt || member.dprt
    );
    setFotoKtpUrl(simulated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

    const finalEkta = nomorEKTA.trim() || member.nomorEKTA;

    const updatedMember: Member = {
      ...member,
      nik: cleanedNik || member.nik,
      nomorEKTA: finalEkta,
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
      dpd,
      dpc: dpc || 'Umum',
      dprt: dprt.trim() || 'Umum',
      isPengurus,
      tingkatKepengurusan: isPengurus ? tingkatKepengurusan : 'Bukan Pengurus',
      wilayahPenugasan: isPengurus ? wilayahPenugasan.trim() : undefined,
      nomorSK: isPengurus && nomorSK.trim() ? nomorSK.trim() : undefined,
      tanggalSK: isPengurus && tanggalSK.trim() ? tanggalSK.trim() : undefined,
      kodeReferral: isPengurus ? kodeReferral.trim() : undefined,
      jabatan,
      status,
      catatanMutasi: catatanMutasi.trim() || member.catatanMutasi,
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
      fotoProfilUrl: fotoProfilUrl.trim() ? fotoProfilUrl.trim() : undefined,
      fotoKtpUrl: fotoKtpUrl.trim() ? fotoKtpUrl.trim() : undefined,
      statusKtpVerified: Boolean(fotoKtpUrl.trim()),
      kaderPerekrutNama: kaderPerekrutNama.trim() || undefined,
      kaderPerekrutJabatan: kaderPerekrutNama.trim() ? kaderPerekrutJabatan.trim() : undefined,
      kaderPerekrutNik: kaderPerekrutNik.trim() || undefined,
      kaderPerekrutDpd: dpd,
      kaderPerekrutKodeReferral: kaderPerekrutKodeReferral.trim() || undefined,
      ketuaLangsungNik: ketuaLangsungInfo?.nik || undefined,
      ketuaLangsungNama: ketuaLangsungInfo?.nama || undefined,
      ketuaLangsungJabatan: ketuaLangsungInfo?.jabatan || undefined,
      ketuaLangsungTingkat: ketuaLangsungInfo?.tingkat || undefined,
    };

    onSave(updatedMember, originalNik);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Formulir Edit Data Anggota
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Mode Edit Kader
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Memperbarui profil kader: <span className="font-semibold text-slate-800 dark:text-slate-200">{member.namaLengkap}</span> · NIK: <span className="font-mono">{member.nik}</span> ({member.dpd})
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

            <EditMemberPhotoKtpSection
              namaLengkap={namaLengkap}
              fotoProfilUrl={fotoProfilUrl}
              onClearFotoProfil={() => setFotoProfilUrl('')}
              onPhotoUpload={handlePhotoUpload}
              isUploadingPhoto={isUploadingPhoto}
              fotoKtpUrl={fotoKtpUrl}
              onClearFotoKtp={() => setFotoKtpUrl('')}
              onKtpUpload={handleKtpUpload}
              isUploadingKtp={isUploadingKtp}
              onGenerateSimulatedKtp={handleGenerateSimulatedKtp}
            />

            {/* Section: Identitas Pokok */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                <span>Identitas Pokok Anggota</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor Induk Kependudukan (NIK Kader Terdaftar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="Contoh: 7171011504620001"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors ${
                      duplicateMember
                        ? 'border-rose-500 focus:ring-rose-400'
                        : isUnchangedNik
                        ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10 focus:ring-emerald-400'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500">
                    <span>Panjang: {cleanedNik.length}/16 digit</span>
                    {(cleanedNik.length === 16 || isUnchangedNik) && !duplicateMember && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Kader Terverifikasi
                      </span>
                    )}
                    {duplicateMember && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> NIK Sudah Digunakan Kader Lain
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
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                    >
                      Auto Generate e-KTA
                    </button>
                  </div>
                  <input
                    type="text"
                    value={nomorEKTA}
                    onChange={(e) => setNomorEKTA(e.target.value)}
                    placeholder="Contoh: 2503196713393376"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>

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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>

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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tempat Lahir (KTP)
                  </label>
                  <input
                    type="text"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder="Contoh: MANADO"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal Lahir (KTP)
                  </label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan' | '')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Agama (KTP)
                  </label>
                  <input
                    type="text"
                    value={agama}
                    onChange={(e) => setAgama(e.target.value)}
                    placeholder="Contoh: Kristen Protestan"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Pekerjaan (KTP)
                  </label>
                  <input
                    type="text"
                    value={pekerjaan}
                    onChange={(e) => setPekerjaan(e.target.value)}
                    placeholder="Contoh: WIRASWASTA"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Alamat Lengkap Sesuai KTP
                  </label>
                  <input
                    type="text"
                    value={alamatLengkap}
                    onChange={(e) => setAlamatLengkap(e.target.value)}
                    placeholder="Jalan, Lingkungan, RT/RW"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            <EditMemberPartyReferralSection
              isPengurus={isPengurus}
              onChangeIsPengurus={setIsPengurus}
              tingkatKepengurusan={tingkatKepengurusan}
              onChangeTingkatKepengurusan={setTingkatKepengurusan}
              allowedTingkatOptions={allowedTingkatOptions}
              nomorSK={nomorSK}
              onChangeNomorSK={setNomorSK}
              kodeReferral={kodeReferral}
              onChangeKodeReferral={setKodeReferral}
              dpd={dpd}
              onChangeDpd={(val) => {
                setDpd(val);
                const region = SULUT_REGIONS.find((r) => r.name === val);
                if (region && region.subdistricts.length > 0) {
                  setDpc(region.subdistricts[0].name);
                }
              }}
              isDpdLocked={isDpdLocked}
              dpc={dpc}
              onChangeDpc={setDpc}
              isDpcLocked={isDpcLocked}
              availableSubdistricts={availableSubdistricts}
              dprt={dprt}
              onChangeDprt={setDprt}
              isDprtLocked={isDprtLocked}
              jabatan={jabatan}
              onChangeJabatan={setJabatan}
              status={status}
              onChangeStatus={setStatus}
              catatanMutasi={catatanMutasi}
              onChangeCatatanMutasi={setCatatanMutasi}
              kaderPerekrutKodeReferral={kaderPerekrutKodeReferral}
              onChangeKaderPerekrutKodeReferral={setKaderPerekrutKodeReferral}
              kaderPerekrutNama={kaderPerekrutNama}
              onChangeKaderPerekrutNama={setKaderPerekrutNama}
              kaderPerekrutJabatan={kaderPerekrutJabatan}
              onChangeKaderPerekrutJabatan={setKaderPerekrutJabatan}
              refValidation={refValidation}
              ketuaLangsungInfo={ketuaLangsungInfo}
            />
          </div>

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
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Konfirmasi & Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
