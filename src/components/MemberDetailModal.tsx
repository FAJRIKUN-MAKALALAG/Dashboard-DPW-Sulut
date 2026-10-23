import React, { useState, useRef } from 'react';
import { Member, UserSession } from '../types';
import nasdemLogo from '../assets/logo/logo_nasdem.png';
import { compressImageFile, generateSimulatedKtp } from '../utils/imageUtils';
import {
  X,
  CheckCircle2,
  FileText,
  IdCard,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  MemberHeroCard,
  MemberBiodataTab,
  MemberKtpTab,
  MemberEktaTab,
  MemberHistoryTab,
} from './member-detail';

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

  const canEdit =
    session.role === 'SUPER_ADMIN' ||
    session.dpdAccess === 'ALL' ||
    session.dpdAccess === member.dpd;

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
                type="button"
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
                <button type="button" onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Member Hero Visual Card */}
            <MemberHeroCard
              member={member}
              canEdit={canEdit}
              isUploadingPhoto={isUploadingPhoto}
              onPhotoUploadClick={() => photoInputRef.current?.click()}
              onOpenStatusChange={onOpenStatusChange}
              onOpenEdit={onOpenEdit}
              onOpenCardModal={onOpenCardModal}
              onWhatsApp={handleWhatsApp}
            />

            {/* Hidden file input for photo */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Hidden file input for KTP */}
            <input
              ref={ktpInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleKtpUpload}
            />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
              {activeTab === 'profile' && (
                <MemberBiodataTab
                  member={member}
                  canEdit={canEdit}
                  isUploadingPhoto={isUploadingPhoto}
                  onPhotoUploadClick={() => photoInputRef.current?.click()}
                  onRemovePhoto={handleRemovePhoto}
                />
              )}

              {activeTab === 'ktp' && (
                <MemberKtpTab
                  member={member}
                  canEdit={canEdit}
                  isUploadingKtp={isUploadingKtp}
                  onKtpUploadClick={() => ktpInputRef.current?.click()}
                  onGenerateSimulatedKtp={handleGenerateSimulatedKtp}
                  onRemoveKtp={handleRemoveKtp}
                  isKtpZoomed={isKtpZoomed}
                  setIsKtpZoomed={setIsKtpZoomed}
                />
              )}

              {activeTab === 'ekta' && (
                <MemberEktaTab
                  member={member}
                  onOpenCardModal={onOpenCardModal}
                />
              )}

              {activeTab === 'history' && (
                <MemberHistoryTab member={member} />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs shrink-0">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                ID NIK: {member.nik} · DPW Partai NasDem Sulawesi Utara
              </span>
              <button
                type="button"
                onClick={onClose}
                className="btn-white px-4 py-1.5 rounded-lg font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
