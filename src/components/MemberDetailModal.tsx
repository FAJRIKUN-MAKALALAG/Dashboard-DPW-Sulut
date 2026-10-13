import React, { useState, useRef } from 'react';
import { Member, UserSession } from '../types';
import { STATUS_BADGE_CONFIG } from '../data/sulutRegions';
import nasdemLogo from '../assets/logo/logo_nasdem.png';
import { compressImageFile, generateSimulatedKtp, getInitials, getAvatarColor } from '../utils/imageUtils';
import {
  X,
  Camera,
  Upload,
  IdCard,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  ExternalLink,
  ZoomIn,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
  QrCode,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  session: UserSession;
  onUpdateMember: (updatedMember: Member) => void;
  onOpenEdit: (member: Member) => void;
  onOpenStatusChange: (member: Member) => void;
  onOpenCardModal: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  session,
  onUpdateMember,
  onOpenEdit,
  onOpenStatusChange,
  onOpenCardModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ktp' | 'ekta' | 'history'>('profile');
  const [isKtpZoomed, setIsKtpZoomed] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isUploadingKtp, setIsUploadingKtp] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !member) return null;

  const statusConfig = STATUS_BADGE_CONFIG[member.status];
  const canEdit =
    session.role === 'SUPER_ADMIN' ||
    session.dpdAccess === 'ALL' ||
    session.dpdAccess === member.dpd;

  const avatarColor = getAvatarColor(member.namaLengkap);

  // Handle Photo Profile Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedDataUrl = await compressImageFile(file, 500, 500, 0.8);
      const updated: Member = {
        ...member,
        fotoProfilUrl: compressedDataUrl,
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session.adminName,
      };
      onUpdateMember(updated);
      setFeedbackMsg('Foto profil kader berhasil diperbarui.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah foto profil.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Remove Photo Profile
  const handleRemovePhoto = () => {
    if (window.confirm('Hapus foto profil kader ini?')) {
      const updated: Member = {
        ...member,
        fotoProfilUrl: undefined,
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session.adminName,
      };
      onUpdateMember(updated);
      setFeedbackMsg('Foto profil berhasil dihapus.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Handle KTP Upload
  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingKtp(true);
      const compressedDataUrl = await compressImageFile(file, 900, 600, 0.8);
      const updated: Member = {
        ...member,
        fotoKtpUrl: compressedDataUrl,
        statusKtpVerified: true,
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session.adminName,
      };
      onUpdateMember(updated);
      setFeedbackMsg('Berkas foto KTP berhasil diunggah dan terverifikasi.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah foto KTP.');
    } finally {
      setIsUploadingKtp(false);
      if (ktpInputRef.current) ktpInputRef.current.value = '';
    }
  };

  // Generate Simulated KTP
  const handleGenerateSimulatedKtp = () => {
    const ktpDataUrl = generateSimulatedKtp(
      member.nik,
      member.namaLengkap,
      member.dpd,
      member.dpc,
      member.dprt
    );
    const updated: Member = {
      ...member,
      fotoKtpUrl: ktpDataUrl,
      statusKtpVerified: true,
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,
    };
    onUpdateMember(updated);
    setFeedbackMsg('Simulasi KTP Elektronik resmi berhasil di-generate.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Remove KTP
  const handleRemoveKtp = () => {
    if (window.confirm('Hapus arsip foto KTP ini?')) {
      const updated: Member = {
        ...member,
        fotoKtpUrl: undefined,
        statusKtpVerified: false,
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: session.adminName,
      };
      onUpdateMember(updated);
      setFeedbackMsg('Arsip KTP berhasil dihapus.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Generate WhatsApp message
  const handleWhatsApp = () => {
    if (!member.nomorHP || member.nomorHP === '-') {
      alert('Nomor HP/WhatsApp kader tidak tersedia.');
      return;
    }
    const cleanPhone = member.nomorHP.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '62' + cleanPhone.substring(1)
      : cleanPhone.startsWith('62')
      ? cleanPhone
      : '62' + cleanPhone;

    const message = encodeURIComponent(
      `Halo Kakak ${member.namaLengkap}, Salam Restorasi! Kami dari Sekretariat DPW Partai NasDem Provinsi Sulawesi Utara menghubungi terkait pendataan keanggotaan (No e-KTA: ${member.nomorEKTA}).`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        />

        {/* Slide-over Right Drawer Container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-300 animate-in slide-in-from-right">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={nasdemLogo}
                alt="Logo Partai NasDem"
                className="h-9 w-auto object-contain shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Detail Profil & Dokumen Kader
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    DPW NasDem Sulut
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Data Pokok Anggota · e-KTA Mandiri & Verifikasi Arsip KTP
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div className="bg-emerald-500 text-white text-xs px-4 py-2 flex items-center justify-between font-medium animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {feedbackMsg}
              </span>
              <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Member Hero Visual Card */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              {/* Photo & Identity Left */}
              <div className="flex items-start sm:items-center gap-4">
                {/* Profile Photo with Upload Trigger */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-slate-800 flex items-center justify-center relative">
                    {member.fotoProfilUrl ? (
                      <img
                        src={member.fotoProfilUrl}
                        alt={member.namaLengkap}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                      >
                        <span className="text-2xl font-bold font-mono">
                          {getInitials(member.namaLengkap)}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-1">
                          NasDem
                        </span>
                      </div>
                    )}

                    {/* Camera overlay hover button */}
                    {canEdit && (
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-medium cursor-pointer"
                        title="Unggah / Ubah Foto Profil"
                      >
                        <Camera className="w-5 h-5 text-amber-400" />
                        <span>{member.fotoProfilUrl ? 'Ubah' : 'Unggah'}</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden file input for photo */}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />

                  {/* Status dot badge */}
                  <div
                    className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 ${
                      member.status === 'Aktif' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                    title={`Status: ${member.status}`}
                  >
                    {member.status === 'Aktif' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {/* Identity Text */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-400 text-slate-950">
                      {member.nomorEKTA}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                    >
                      {member.status}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {member.namaLengkap}
                  </h2>

                  <p className="text-amber-300 font-semibold text-xs sm:text-sm">
                    {member.jabatan}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {member.dpd} · Kec. {member.dpc}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-slate-400">NIK: {member.nik}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Right */}
              <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                {/* Ubah Status */}
                <button
                  disabled={!canEdit}
                  onClick={() => onOpenStatusChange(member)}
                  className="btn-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                  title="Ubah Status Keanggotaan"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ubah Status</span>
                </button>

                {/* Edit Data */}
                <button
                  disabled={!canEdit}
                  onClick={() => onOpenEdit(member)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 cursor-pointer shadow-sm transition-colors"
                  title="Edit Data Lengkap Kader"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                {/* Pratinjau KTA */}
                <button
                  onClick={() => onOpenCardModal(member)}
                  className="btn-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  title="Lihat Kartu e-KTA Digital"
                >
                  <IdCard className="w-3.5 h-3.5 text-blue-500" />
                  <span>e-KTA Digital</span>
                </button>

                {/* WhatsApp */}
                {member.nomorHP && member.nomorHP !== '-' && (
                  <button
                    onClick={handleWhatsApp}
                    className="btn-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    title="Hubungi Kader via WhatsApp"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Biodata & Struktur</span>
            </button>

            <button
              onClick={() => setActiveTab('ktp')}
              className={`pb-3 px-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'ktp'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <IdCard className="w-4 h-4" />
              <span>Foto KTP Asli ({member.fotoKtpUrl ? 'Tersedia' : 'Belum Ada'})</span>
              {member.fotoKtpUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ekta')}
              className={`pb-3 px-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'ekta'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Visual Kartu e-KTA</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat Mutasi & Audit</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
            {/* TAB 1: BIODATA & STRUKTUR */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Photo Management Row */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Manajemen Foto Profil Kader
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {member.fotoProfilUrl
                          ? 'Foto profil tersimpan dan digunakan di kartu e-KTA digital.'
                          : 'Belum ada foto profil. Anda dapat mengunggah foto kader berjas atau berbusana resmi Partai NasDem.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto || !canEdit}
                      className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>{member.fotoProfilUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    </button>
                    {member.fotoProfilUrl && canEdit && (
                      <button
                        onClick={handleRemovePhoto}
                        className="btn-white text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer"
                        title="Hapus Foto Profil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2-Column Grid of Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Data Kependudukan */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <IdCard className="w-4 h-4" />
                      <span>Data Identitas & Kependudukan</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Nomor Induk Kependudukan (NIK)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white" data-tabular="true">
                          {member.nik}
                        </span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Nama Lengkap</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{member.namaLengkap}</span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Nomor HP / WhatsApp</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {member.nomorHP || '-'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Verifikasi Berkas KTP</span>
                        <span className="flex items-center gap-1 font-semibold">
                          {member.fotoKtpUrl ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi KTP
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Menunggu Unggah KTP
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Struktur & Penugasan Partai */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <MapPin className="w-4 h-4" />
                      <span>Struktur Partai & Wilayah Kerja</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Nomor e-KTA Partai NasDem</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400" data-tabular="true">
                          {member.nomorEKTA}
                        </span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Tingkat DPD (Kabupaten/Kota)</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{member.dpd}</span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Tingkat DPC (Kecamatan)</span>
                        <span className="font-medium text-slate-900 dark:text-white">Kec. {member.dpc}</span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Tingkat DPRt (Desa/Kelurahan)</span>
                        <span className="font-medium text-slate-900 dark:text-white">{member.dprt || '-'}</span>
                      </div>

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Status Kepengurusan Ber-SK</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {member.isPengurus ? (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                              Pengurus {member.tingkatKepengurusan || 'DPW'}
                            </span>
                          ) : (
                            <span className="text-slate-500">Anggota Biasa (Non-Pengurus)</span>
                          )}
                        </span>
                      </div>

                      {member.nomorSK && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Nomor SK Resmi</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {member.nomorSK}
                          </span>
                        </div>
                      )}

                      {member.kodeReferral && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Kode Referral Perekrut (Unik)</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                            {member.kodeReferral}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Penugasan / Jabatan</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">{member.jabatan}</span>
                      </div>

                      {member.email && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Email</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">{member.email}</span>
                        </div>
                      )}

                      {member.sosmed && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Media Sosial</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{member.sosmed}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Tanggal Bergabung Resmi</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {member.tanggalBergabung}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Box */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status Keanggotaan & Kebijakan Suara
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {member.catatanMutasi ||
                      'Tidak ada catatan mutasi. Anggota berstatus aktif dan terhitung dalam validasi faktual DPW.'}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Terakhir diubah: {member.terakhirDiubah || '-'}</span>
                    <span>Operator: {member.diubahOleh || 'Sistem DPW'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FOTO KTP ASLI / SIMULASI */}
            {activeTab === 'ktp' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <IdCard className="w-4 h-4 text-blue-500" />
                      <span>Arsip Dokumen KTP Elektronik Anggota</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dokumen KTP digunakan oleh Admin DPW & Bappilu untuk verifikasi NIK faktual dan pencocokan data pemilih.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => ktpInputRef.current?.click()}
                      disabled={isUploadingKtp || !canEdit}
                      className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>{member.fotoKtpUrl ? 'Ganti Foto KTP' : 'Unggah Foto KTP'}</span>
                    </button>

                    <button
                      onClick={handleGenerateSimulatedKtp}
                      disabled={!canEdit}
                      className="btn-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                      title="Hasilkan simulasi e-KTP resmi berdasarkan NIK dan identitas kader"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Hasilkan e-KTP Otomatis</span>
                    </button>

                    {member.fotoKtpUrl && canEdit && (
                      <button
                        onClick={handleRemoveKtp}
                        className="btn-white text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer"
                        title="Hapus Arsip KTP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden file input for KTP */}
                <input
                  ref={ktpInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleKtpUpload}
                />

                {/* KTP Preview Area */}
                {member.fotoKtpUrl ? (
                  <div className="space-y-3">
                    <div className="relative group max-w-2xl mx-auto rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-xl bg-slate-950">
                      <img
                        src={member.fotoKtpUrl}
                        alt={`KTP ${member.namaLengkap}`}
                        className="w-full h-auto object-contain max-h-[380px] mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                      />

                      {/* Overlay action bar */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 text-white">
                        <div className="text-xs">
                          <span className="font-bold block">{member.namaLengkap}</span>
                          <span className="font-mono text-[11px] text-amber-400">NIK: {member.nik}</span>
                        </div>
                        <button
                          onClick={() => setIsKtpZoomed(true)}
                          className="btn-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-lg"
                        >
                          <ZoomIn className="w-4 h-4 text-blue-500" />
                          <span>Perbesar Layar Penuh</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Arsip KTP Terverifikasi untuk NIK {member.nik}</span>
                      </span>
                      <button
                        onClick={() => setIsKtpZoomed(true)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Buka Tampilan Zoom</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <IdCard className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Belum Ada Dokumen KTP untuk Kader Ini
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Admin dapat mengunggah foto KTP asli hasil foto kamera/scan, atau menggunakan generator otomatis e-KTP resmi berbasis NIK 16 digit.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => ktpInputRef.current?.click()}
                        disabled={!canEdit}
                        className="btn-white flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-blue-500" />
                        <span>Pilih Berkas Foto KTP</span>
                      </button>
                      <button
                        onClick={handleGenerateSimulatedKtp}
                        disabled={!canEdit}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-sm transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Hasilkan e-KTP Otomatis</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VISUAL KARTU E-KTA */}
            {activeTab === 'ekta' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Kartu Tanda Anggota Elektronik (e-KTA)
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Standar kartu digital DPW Partai NasDem Sulawesi Utara dilengkapi Chip ID & QR Verifikasi.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenCardModal(member)}
                    className="btn-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Mode Cetak / Unduh</span>
                  </button>
                </div>

                {/* Rendered Live e-KTA Card */}
                <div className="max-w-xl mx-auto">
                  <div className="relative w-full aspect-[85.6/53.98] rounded-2xl overflow-hidden shadow-2xl p-5 flex flex-col justify-between border border-amber-500/40 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white select-none">
                    {/* Background watermarks */}
                    <div className="absolute inset-0 bg-radial from-blue-700/20 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Card Top: Logo & Title */}
                    <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={nasdemLogo}
                          alt="Partai NasDem"
                          className="h-9 w-auto object-contain drop-shadow"
                        />
                        <div className="text-left">
                          <h4 className="text-xs font-bold tracking-tight text-white leading-tight">
                            PARTAI NASDEM
                          </h4>
                          <p className="text-[9px] text-amber-300 font-medium">
                            DPW SULAWESI UTARA
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[8px] uppercase tracking-wider font-mono text-blue-200 block">
                          KARTU TANDA ANGGOTA
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          e-KTA DIGITAL
                        </span>
                      </div>
                    </div>

                    {/* Card Middle: Photo + Info */}
                    <div className="relative z-10 grid grid-cols-4 gap-3 my-auto items-center">
                      {/* Photo or Chip */}
                      <div className="col-span-1 flex flex-col items-center gap-1">
                        <div className="w-16 h-20 rounded-lg bg-slate-800 border border-amber-400/60 overflow-hidden flex items-center justify-center relative shadow-inner">
                          {member.fotoProfilUrl ? (
                            <img
                              src={member.fotoProfilUrl}
                              alt={member.namaLengkap}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex flex-col items-center justify-center ${avatarColor.bgClass} ${avatarColor.textClass}`}
                            >
                              <span className="text-base font-bold font-mono">
                                {getInitials(member.namaLengkap)}
                              </span>
                              <div className="w-4 h-2 rounded bg-amber-400/40 border border-amber-400/70 mt-1"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="col-span-3 space-y-1 text-left">
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase font-mono block">
                            Nama Lengkap
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                            {member.namaLengkap}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                          <div>
                            <span className="text-[7px] text-slate-400 uppercase block">NIK KTP</span>
                            <span className="text-slate-200 font-bold" data-tabular="true">
                              {member.nik}
                            </span>
                          </div>
                          <div>
                            <span className="text-[7px] text-slate-400 uppercase block">No e-KTA Pusat</span>
                            <span className="text-amber-400 font-bold" data-tabular="true">
                              {member.nomorEKTA}
                            </span>
                          </div>
                        </div>

                        <div className="text-[9px]">
                          <span className="text-[7px] text-slate-400 uppercase font-mono block">
                            Jabatan / Penugasan
                          </span>
                          <p className="text-amber-300 font-semibold truncate">{member.jabatan}</p>
                        </div>

                        <div className="text-[8px] text-slate-300 truncate">
                          <span>{member.dpd}</span> · <span>Kec. {member.dpc}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom */}
                    <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Status Validasi:</span>
                        <span className={`font-semibold ${statusConfig.textClass}`}>
                          {member.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <QrCode className="w-3 h-3 text-slate-300" />
                        <span>SECURE-ID-NASDEM-SULUT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: RIWAYAT MUTASI & AUDIT */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                    Catatan Audit & Riwayat Mutasi Kader
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Setiap perubahan data identitas, foto, maupun status keanggotaan tercatat secara kronologis dalam sistem shadow database DPW.
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="p-4 bg-white dark:bg-slate-900 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Pembaruan Terakhir Data Anggota
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {member.terakhirDiubah || '2024-06-01'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Diperbarui oleh: <strong className="text-slate-800 dark:text-slate-200">{member.diubahOleh || 'Sistem DPW'}</strong>
                      </p>
                      {member.catatanMutasi && (
                        <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 italic border border-slate-200/60 dark:border-slate-800 text-[11px]">
                          "{member.catatanMutasi}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Registrasi Anggota & Penerbitan e-KTA
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {member.tanggalBergabung}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        Kader resmi terdaftar di struktur DPW Partai NasDem Provinsi Sulawesi Utara.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs shrink-0">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              ID NIK: {member.nik} · DPW Partai NasDem Sulawesi Utara
            </span>
            <button
              onClick={onClose}
              className="btn-white px-4 py-1.5 rounded-lg font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal for KTP */}
      {isKtpZoomed && member.fotoKtpUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsKtpZoomed(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">
                  Arsip Dokumen KTP: {member.namaLengkap} ({member.nik})
                </span>
              </div>
              <button
                onClick={() => setIsKtpZoomed(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black/50">
              <img
                src={member.fotoKtpUrl}
                alt={`KTP ${member.namaLengkap}`}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>DPW Partai NasDem Sulawesi Utara · Arsip Faktual</span>
              <button
                onClick={() => setIsKtpZoomed(false)}
                className="btn-white px-3 py-1 text-xs rounded-lg cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
