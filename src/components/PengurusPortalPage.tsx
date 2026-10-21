import React, { useState, useEffect, useMemo } from 'react';
import {
  UserSession,
  Member,
  MyReferralProfile,
  DirectLeaderInfo,
} from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { referralService } from '../services/referralService';
import {
  Sparkles,
  Shield,
  Copy,
  Check,
  Share2,
  QrCode,
  UserPlus,
  Users,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  IdCard,
  FileText,
  Lock,
  ChevronRight,
  Phone,
  UserCheck,
} from 'lucide-react';

interface PengurusPortalPageProps {
  members: Member[];
  session: UserSession;
  onAddMember: (newMember: Member) => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
}

export const PengurusPortalPage: React.FC<PengurusPortalPageProps> = ({
  members,
  session,
  onAddMember,
  onRefreshCloud,
  isRefreshingCloud = false,
}) => {
  // State profil pengurus aktif
  const [profile, setProfile] = useState<MyReferralProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);

  // Selector untuk Super Admin / Admin DPW agar dapat melihat simulasi halaman sebagai pengurus DPRt / DPC / DPD
  const isSuperUser = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW';
  const pengurusList = useMemo(() => {
    return members.filter((m) => m.isPengurus);
  }, [members]);

  const [selectedPengurusNik, setSelectedPengurusNik] = useState<string>('');

  // Anggota aktif pengurus yang sedang ditampilkan
  const activePengurusMember = useMemo(() => {
    if (selectedPengurusNik) {
      return members.find((m) => m.nik === selectedPengurusNik) || null;
    }
    // Jika ada session.adminNik, cari anggota dengan NIK tersebut
    if (session.adminNik) {
      const match = members.find((m) => m.nik === session.adminNik);
      if (match) return match;
    }
    // Fallback pertama jika ada pengurus
    return pengurusList[0] || null;
  }, [selectedPengurusNik, session.adminNik, members, pengurusList]);

  // Load profil referral dari backend
  const loadReferralProfile = async () => {
    setLoadingProfile(true);
    try {
      if (selectedPengurusNik) {
        const res = await referralService.getReferralPreviewByNik(selectedPengurusNik);
        setProfile(res);
      } else {
        const res = await referralService.getMyReferralProfile();
        setProfile(res);
      }
    } catch (err) {
      console.warn('Gagal memuat profil referral via API, menggunakan fallback lokal:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadReferralProfile();
  }, [selectedPengurusNik]);

  // Menentukan Kode Referral Pengurus & Ketua Langsung
  const myReferralCode = useMemo(() => {
    if (activePengurusMember?.kodeReferral) {
      return activePengurusMember.kodeReferral;
    }
    if (profile?.kodeReferral) {
      return profile.kodeReferral;
    }
    const tingkat = (activePengurusMember?.tingkatKepengurusan || session.role.substring(0, 3) || 'DPW').toUpperCase();
    return `NSD-${tingkat.substring(0, 3)}-${activePengurusMember?.nik ? activePengurusMember.nik.slice(-4) : '0001'}`;
  }, [activePengurusMember, profile, session]);

  // Hierarki Ketua Langsung (Otomatis Tracking Sistem)
  const ketuaLangsung: DirectLeaderInfo = useMemo(() => {
    if (profile?.ketuaLangsung && profile.ketuaLangsung.nama) {
      return profile.ketuaLangsung;
    }
    // Fallback pencarian dinamis langsung dari database members aktif
    const tingkat = activePengurusMember?.tingkatKepengurusan || 'DPC';
    const currentJabatan = (activePengurusMember?.jabatan || '').toLowerCase();
    const isCurrentKetua = currentJabatan.startsWith('ketua') && !currentJabatan.includes('wakil') && !currentJabatan.includes('sekretaris');

    if (tingkat === 'DPRt') {
      if (!isCurrentKetua) {
        const ketuaDprt = members.find((m) => 
          m.tingkatKepengurusan === 'DPRt' && 
          m.dpd === activePengurusMember?.dpd && 
          m.dpc === activePengurusMember?.dpc && 
          m.dprt === activePengurusMember?.dprt &&
          (m.jabatan || '').toLowerCase().startsWith('ketua') &&
          !(m.jabatan || '').toLowerCase().includes('wakil')
        );
        if (ketuaDprt) {
          return {
            nik: ketuaDprt.nik,
            nama: ketuaDprt.namaLengkap,
            jabatan: ketuaDprt.jabatan,
            tingkat: 'DPRt',
            kodeReferral: ketuaDprt.kodeReferral || `NSD-DPR-${ketuaDprt.nik.slice(-4)}`,
          };
        }
      }
      // Cari Ketua DPC
      const ketuaDpc = members.find((m) => 
        m.tingkatKepengurusan === 'DPC' && 
        m.dpd === activePengurusMember?.dpd && 
        m.dpc === activePengurusMember?.dpc &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpc) {
        return {
          nik: ketuaDpc.nik,
          nama: ketuaDpc.namaLengkap,
          jabatan: ketuaDpc.jabatan,
          tingkat: 'DPC',
          kodeReferral: ketuaDpc.kodeReferral || `NSD-DPC-${ketuaDpc.nik.slice(-4)}`,
        };
      }
    } else if (tingkat === 'DPC') {
      if (!isCurrentKetua) {
        const ketuaDpc = members.find((m) => 
          m.tingkatKepengurusan === 'DPC' && 
          m.dpd === activePengurusMember?.dpd && 
          m.dpc === activePengurusMember?.dpc &&
          (m.jabatan || '').toLowerCase().startsWith('ketua') &&
          !(m.jabatan || '').toLowerCase().includes('wakil')
        );
        if (ketuaDpc) {
          return {
            nik: ketuaDpc.nik,
            nama: ketuaDpc.namaLengkap,
            jabatan: ketuaDpc.jabatan,
            tingkat: 'DPC',
            kodeReferral: ketuaDpc.kodeReferral || `NSD-DPC-${ketuaDpc.nik.slice(-4)}`,
          };
        }
      }
      // Cari Ketua DPD
      const ketuaDpd = members.find((m) => 
        m.tingkatKepengurusan === 'DPD' && 
        m.dpd === activePengurusMember?.dpd &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpd) {
        return {
          nik: ketuaDpd.nik,
          nama: ketuaDpd.namaLengkap,
          jabatan: ketuaDpd.jabatan,
          tingkat: 'DPD',
          kodeReferral: ketuaDpd.kodeReferral || `NSD-DPD-${ketuaDpd.nik.slice(-4)}`,
        };
      }
    } else if (tingkat === 'DPD') {
      if (!isCurrentKetua) {
        const ketuaDpd = members.find((m) => 
          m.tingkatKepengurusan === 'DPD' && 
          m.dpd === activePengurusMember?.dpd &&
          (m.jabatan || '').toLowerCase().startsWith('ketua') &&
          !(m.jabatan || '').toLowerCase().includes('wakil')
        );
        if (ketuaDpd) {
          return {
            nik: ketuaDpd.nik,
            nama: ketuaDpd.namaLengkap,
            jabatan: ketuaDpd.jabatan,
            tingkat: 'DPD',
            kodeReferral: ketuaDpd.kodeReferral || `NSD-DPD-${ketuaDpd.nik.slice(-4)}`,
          };
        }
      }
      // Cari Ketua DPW
      const ketuaDpw = members.find((m) => 
        m.tingkatKepengurusan === 'DPW' &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpw) {
        return {
          nik: ketuaDpw.nik,
          nama: ketuaDpw.namaLengkap,
          jabatan: ketuaDpw.jabatan,
          tingkat: 'DPW',
          kodeReferral: ketuaDpw.kodeReferral || `NSD-DPW-${ketuaDpw.nik.slice(-4)}`,
        };
      }
    } else if (tingkat === 'DPW' && !isCurrentKetua) {
      const ketuaDpw = members.find((m) => 
        m.tingkatKepengurusan === 'DPW' &&
        (m.jabatan || '').toLowerCase().startsWith('ketua') &&
        !(m.jabatan || '').toLowerCase().includes('wakil')
      );
      if (ketuaDpw) {
        return {
          nik: ketuaDpw.nik,
          nama: ketuaDpw.namaLengkap,
          jabatan: ketuaDpw.jabatan,
          tingkat: 'DPW',
          kodeReferral: ketuaDpw.kodeReferral || `NSD-DPW-${ketuaDpw.nik.slice(-4)}`,
        };
      }
    }

    return {
      nik: '0000000000000000',
      nama: 'Surya Paloh',
      jabatan: 'Ketua Umum DPP Partai NasDem',
      tingkat: 'DPP',
      kodeReferral: 'NSD-DPP-SURYA',
    };
  }, [profile, activePengurusMember, members]);

  // Handler Copy
  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // WhatsApp share message
  const shareText = useMemo(() => {
    const nama = activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName;
    const jabatan = activePengurusMember?.jabatan || profile?.jabatan || session.jabatan;
    return encodeURIComponent(
      `Halo! Mari bergabung dalam Gerakan Perubahan bersama PARTAI NASDEM SULAWESI UTARA 💙🧡\n\n` +
      `Saya mengundang Anda untuk mendaftar sebagai kader resmi Partai NasDem melalui jalur kepengurusan saya:\n\n` +
      `👉 KODE REFERRAL SAYA: *${myReferralCode}*\n` +
      `👤 Pengurus Perekrut: ${nama} (${jabatan})\n` +
      `🛡️ Supervisi Atasan: ${ketuaLangsung.nama} (${ketuaLangsung.jabatan})\n\n` +
      `Bersatu, Berjuang, Menang! 🇮🇩`
    );
  }, [myReferralCode, activePengurusMember, profile, session, ketuaLangsung]);

  // ---------------- FORM PENDAFTARAN ANGGOTA BARU ----------------
  const defaultDpd = activePengurusMember?.dpd || (session.dpdAccess !== 'ALL' ? session.dpdAccess : SULUT_REGIONS[0].name);
  const defaultDpc = activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? activePengurusMember.dpc : '';
  const defaultDprt = activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? activePengurusMember.dprt : '';

  const [inputNik, setInputNik] = useState<string>('');
  const [inputEkta, setInputEkta] = useState<string>('');
  const [inputNama, setInputNama] = useState<string>('');
  const [inputHp, setInputHp] = useState<string>('');
  const [inputDpd, setInputDpd] = useState<string>(defaultDpd);
  const [inputDpc, setInputDpc] = useState<string>(defaultDpc);
  const [inputDprt, setInputDprt] = useState<string>(defaultDprt);
  const [inputAlamat, setInputAlamat] = useState<string>('');
  const [inputGender, setInputGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync default wilayah when pengurus changes
  useEffect(() => {
    setInputDpd(defaultDpd);
    setInputDpc(defaultDpc);
    setInputDprt(defaultDprt);
  }, [defaultDpd, defaultDpc, defaultDprt]);

  // Cari kecamatan yang tersedia berdasarkan DPD terpilih
  const currentRegion = SULUT_REGIONS.find((r) => r.name === inputDpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  // Filter rekrutmen saya (Kader yang direkrut oleh pengurus aktif ini)
  const [searchRecruit, setSearchRecruit] = useState<string>('');
  const myRecruits = useMemo(() => {
    const currentCode = myReferralCode.toUpperCase();
    const currentNik = activePengurusMember?.nik || session.adminNik;
    const currentName = (activePengurusMember?.namaLengkap || session.adminName || '').toLowerCase();

    return members.filter((m) => {
      if (m.kaderPerekrutKodeReferral && m.kaderPerekrutKodeReferral.toUpperCase() === currentCode) return true;
      if (currentNik && m.kaderPerekrutNik === currentNik) return true;
      if (m.kaderPerekrutNama && m.kaderPerekrutNama.toLowerCase() === currentName) return true;
      return false;
    });
  }, [members, myReferralCode, activePengurusMember, session]);

  const filteredRecruits = useMemo(() => {
    if (!searchRecruit.trim()) return myRecruits;
    const q = searchRecruit.toLowerCase();
    return myRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.dpd.toLowerCase().includes(q) ||
        m.dpc.toLowerCase().includes(q)
    );
  }, [myRecruits, searchRecruit]);

  // Handler Submit Pendaftaran Anggota Baru
  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanNik = inputNik.replace(/[^0-9]/g, '').trim();
    if (cleanNik.length !== 16) {
      setFormError('Nomor NIK KTP wajib 16 digit angka.');
      return;
    }

    if (!inputNama.trim()) {
      setFormError('Nama lengkap calon kader wajib diisi.');
      return;
    }

    // Cek duplikasi NIK
    const isDuplicate = members.some((m) => m.nik === cleanNik);
    if (isDuplicate) {
      setFormError(`NIK ${cleanNik} sudah terdaftar sebelumnya di database.`);
      return;
    }

    setIsSubmitting(true);

    const perekrutNama = activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName;
    const perekrutJabatan = activePengurusMember?.jabatan || profile?.jabatan || session.jabatan;
    const perekrutNik = activePengurusMember?.nik || session.adminNik;

    const newMember: Member = {
      nik: cleanNik,
      nomorEKTA: inputEkta.trim() || cleanNik,
      namaLengkap: inputNama.trim(),
      nomorHP: inputHp.trim() || '-',
      dpd: inputDpd,
      dpc: inputDpc || 'Umum',
      dprt: inputDprt.trim() || 'Umum',
      alamatLengkap: inputAlamat.trim() || undefined,
      jenisKelamin: inputGender,
      isPengurus: false,
      tingkatKepengurusan: 'Bukan Pengurus',
      jabatan: 'Anggota Biasa',
      status: 'Aktif',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: `Perekrutan mandiri oleh ${perekrutNama} (${perekrutJabatan}) via Portal Pengurus`,
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,

      // Atribusi Perekrut Otomatis
      kaderPerekrutKodeReferral: myReferralCode,
      kaderPerekrutNama: perekrutNama,
      kaderPerekrutJabatan: perekrutJabatan,
      kaderPerekrutNik: perekrutNik,
      kaderPerekrutDpd: inputDpd,

      // Atribusi Ketua Langsung Otomatis
      ketuaLangsungNik: ketuaLangsung.nik,
      ketuaLangsungNama: ketuaLangsung.nama,
      ketuaLangsungJabatan: ketuaLangsung.jabatan,
      ketuaLangsungTingkat: ketuaLangsung.tingkat,
    };

    onAddMember(newMember);

    setIsSubmitting(false);
    setFormSuccess(`Kader ${newMember.namaLengkap} berhasil didaftarkan dan langsung terhubung dengan kode Anda!`);

    // Reset input
    setInputNik('');
    setInputEkta('');
    setInputNama('');
    setInputHp('');
    setInputAlamat('');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 1. Header Banner & Switcher (Khusus Super Admin) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-blue-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PORTAL KERJA MANDIRI PENGURUS & REKRUTMEN</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Identitas Pengurus & Garis Komando Hierarkis
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Halaman kerja personal pengurus untuk memantau Surat Keputusan (SK), kode referral unik, mengetahui Ketua Langsung pembina wilayah, serta mendaftarkan anggota baru di lapangan secara langsung.
          </p>
        </div>

        {/* Super Admin Simulator: Pilih Pengurus untuk Ditampilkan */}
        {isSuperUser && (
          <div className="relative z-10 bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl shadow-lg shrink-0 w-full md:w-80 space-y-2">
            <label className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
              <span>Simulasi Pengurus (Super Admin):</span>
              <span className="text-[10px] text-slate-400 font-normal">Ganti Pengurus</span>
            </label>
            <select
              value={selectedPengurusNik}
              onChange={(e) => setSelectedPengurusNik(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
            >
              <option value="">-- Profil Akun Saya ({session.adminName}) --</option>
              {pengurusList.slice(0, 100).map((p) => (
                <option key={p.nik} value={p.nik}>
                  [{p.tingkatKepengurusan || 'DPD'}] {p.namaLengkap} - {p.jabatan} ({p.dpd})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Kartu Identitas Resmi Pengurus (Digital ID Profile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profil & Status SK */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0 border-2 border-amber-400">
                {(activePengurusMember?.namaLengkap || session.adminName || 'ND')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
                  activePengurusMember?.tingkatKepengurusan === 'DPW'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : activePengurusMember?.tingkatKepengurusan === 'DPD'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : activePengurusMember?.tingkatKepengurusan === 'DPC'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  <Shield className="w-3 h-3" />
                  <span>Pengurus {activePengurusMember?.tingkatKepengurusan || session.role.replace('ADMIN_', '')}</span>
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {activePengurusMember?.namaLengkap || profile?.namaLengkap || session.adminName}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {activePengurusMember?.jabatan || profile?.jabatan || session.jabatan}
                </p>
              </div>
            </div>

            {/* Garis Pembatas */}
            <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

            {/* Info Berkas Identitas & SK */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nomor NIK KTP</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activePengurusMember?.nik || session.adminNik || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nomor E-KTA NasDem</span>
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {activePengurusMember?.nomorEKTA || activePengurusMember?.nik || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Penugasan Wilayah</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[180px] truncate">
                  {activePengurusMember?.dpd || session.dpdAccess}
                  {activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? ` • Kec. ${activePengurusMember.dpc}` : ''}
                  {activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? ` • Desa ${activePengurusMember.dprt}` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Nomor SK Resmi</span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {activePengurusMember?.nomorSK || 'SK-DPW-SULUT-2024'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Status Keanggotaan</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {activePengurusMember?.status || 'Aktif'}
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Dua Kartu Berdampingan (Kode Referral Saya vs Ketua Langsung) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* KARTU 1: KODE REFERRAL SAYA */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-blue-700/40 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kode Referral Unik Anda</span>
                </span>

                <span className="text-[11px] text-slate-300 font-semibold bg-white/10 px-2 py-0.5 rounded-lg">
                  {myRecruits.length} Kader Direkrut
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  KODE SAYA:
                </span>
                <div className="bg-slate-950/80 border-2 border-amber-400 rounded-2xl px-5 py-3 font-mono text-2xl font-black text-amber-300 tracking-wider flex items-center justify-between shadow-inner">
                  <span>{myReferralCode}</span>
                  <button
                    onClick={() => handleCopy(myReferralCode, 'myCode')}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Salin Kode Referral"
                  >
                    {copiedCode === 'myCode' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Bagikan kode ini ke calon kader. Setiap kader baru yang mendaftar dengan kode ini otomatis tercatat di bawah binaan Anda.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2.5 relative z-10">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all text-center"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan WhatsApp</span>
              </a>

              <button
                onClick={() => setShowQr(!showQr)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>{showQr ? 'Tutup QR' : 'QR Barcode'}</span>
              </button>
            </div>

            {/* QR Pop-down */}
            {showQr && (
              <div className="mt-4 p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center text-slate-900 animate-in fade-in">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `NASDEM-REF:${myReferralCode}`
                  )}`}
                  alt="QR Referral"
                  className="w-36 h-36 rounded-lg"
                />
                <p className="text-[11px] font-bold text-slate-600 mt-2">
                  Scan untuk mendaftar dengan kode {myReferralCode}
                </p>
              </div>
            )}
          </div>

          {/* KARTU 2: KETUA LANGSUNG & SISTEM ATRIBUSI HIERARKIS */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-900/60">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ketua Langsung Pembina (Supervisi)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Otomatis
                </span>
              </div>

              {/* Box Info Ketua Langsung */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Ketua Wilayah Terkait:
                  </span>
                  <span className="text-[10px] font-extrabold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md">
                    Tingkat {ketuaLangsung.tingkat}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {ketuaLangsung.nama}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {ketuaLangsung.jabatan}
                </p>

                {/* Kode Referral Ketua Langsung */}
                <div className="pt-2 mt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Kode Referral Ketua:
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 shadow-2xs">
                    <span>{ketuaLangsung.kodeReferral || `NSD-${ketuaLangsung.tingkat}-KETUA`}</span>
                    <button
                      onClick={() => handleCopy(ketuaLangsung.kodeReferral || `NSD-${ketuaLangsung.tingkat}-KETUA`, 'ketuaCode')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Salin Kode Ketua"
                    >
                      {copiedCode === 'ketuaCode' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Penjelasan Aturan Garis Hierarki */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Garis Komando Resmi:</strong> Sistem otomatis mengenali posisi Anda di <strong>{activePengurusMember?.dpd || session.dpdAccess}</strong> dan membina koordinasi langsung dengan <strong>{ketuaLangsung.nama}</strong>. Setiap anggota baru yang Anda masukkan akan tercatat atas nama Anda sekaligus memperkuat laporan supervisi ketua di atas Anda.
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono text-right">
              NIK Ketua: {ketuaLangsung.nik}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Formulir Cepat Pendaftaran Anggota Baru (Quick Recruit Form) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Pendaftaran Anggota Baru (Jalur Rekrutmen Mandiri Pengurus)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perekrut dan Ketua Langsung otomatis terisi &amp; terkunci ke identitas akun Anda (Zero Error).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-blue-500" />
              <span>Perekrut: {myReferralCode}</span>
            </span>
          </div>
        </div>

        {/* Notifikasi Sukses / Error Form */}
        {formSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleRegisterMember} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. NIK */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nomor NIK KTP (16 Digit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={16}
                value={inputNik}
                onChange={(e) => setInputNik(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="7105..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                {inputNik.length}/16 digit {inputNik.length === 16 ? '✓ Lengkap' : ''}
              </span>
            </div>

            {/* 2. Nama Lengkap */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Lengkap Calon Kader <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={inputNama}
                onChange={(e) => setInputNama(e.target.value)}
                placeholder="Sesuai KTP"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              />
            </div>

            {/* 3. Nomor WhatsApp / HP */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                value={inputHp}
                onChange={(e) => setInputHp(e.target.value)}
                placeholder="0812..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* 4. Nomor E-KTA */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nomor E-KTA (Opsional)
              </label>
              <input
                type="text"
                value={inputEkta}
                onChange={(e) => setInputEkta(e.target.value)}
                placeholder="Sama dengan NIK jika kosong"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Wilayah Domisili Calon Anggota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                DPD (Kabupaten / Kota)
              </label>
              <select
                value={inputDpd}
                onChange={(e) => {
                  setInputDpd(e.target.value);
                  const reg = SULUT_REGIONS.find((r) => r.name === e.target.value);
                  if (reg && reg.subdistricts.length > 0) {
                    setInputDpc(reg.subdistricts[0].name);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              >
                {SULUT_REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                DPC (Kecamatan)
              </label>
              <select
                value={inputDpc}
                onChange={(e) => setInputDpc(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              >
                {availableSubdistricts.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    Kec. {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                DPRt (Kelurahan / Desa)
              </label>
              <input
                type="text"
                value={inputDprt}
                onChange={(e) => setInputDprt(e.target.value)}
                placeholder="Contoh: Ranomeida"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Jenis Kelamin
              </label>
              <select
                value={inputGender}
                onChange={(e) => setInputGender(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Baris Alamat Lengkap & Tombol Daftarkan */}
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Alamat Domisili Lengkap
              </label>
              <input
                type="text"
                value={inputAlamat}
                onChange={(e) => setInputAlamat(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all disabled:opacity-60 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Anggota Baru Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Riwayat Anggota yang Berhasil Direkrut Pengurus Ini */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Daftar Kader Hasil Rekrutmen Anda ({myRecruits.length} Anggota)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kader resmi Partai NasDem yang terdaftar melalui kode referral Anda ({myReferralCode}).
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchRecruit}
              onChange={(e) => setSearchRecruit(e.target.value)}
              placeholder="Cari nama / NIK..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        {filteredRecruits.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum Ada Anggota yang Terdaftar Melalui Kode Ini
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Gunakan formulir di atas untuk mendaftarkan kader baru atau bagikan kode referral Anda ({myReferralCode}) ke calon kader.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Nama Kader</th>
                  <th className="p-3.5">NIK &amp; E-KTA</th>
                  <th className="p-3.5">Wilayah Domisili</th>
                  <th className="p-3.5">WhatsApp / HP</th>
                  <th className="p-3.5">Tanggal Daftar</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecruits.map((m) => (
                  <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {m.namaLengkap}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      <div>{m.nik}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">{m.nomorEKTA || '-'}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{m.dpd}</div>
                      <div className="text-[10px] text-slate-400">{m.dpc} • {m.dprt}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {m.nomorHP || '-'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {m.tanggalBergabung}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
