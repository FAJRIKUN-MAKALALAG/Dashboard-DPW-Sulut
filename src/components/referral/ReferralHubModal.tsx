import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Users,
  Award,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Info,
  Building,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { UserSession, Member, MyReferralProfile, ReferralTrackingData } from '../../types';
import { referralService } from '../../services/referralService';

interface ReferralHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onOpenAddMemberWithRef?: (refCode: string) => void;
}

export const ReferralHubModal: React.FC<ReferralHubModalProps> = ({
  isOpen,
  onClose,
  session,
  onOpenAddMemberWithRef,
}) => {
  const [activeTab, setActiveTab] = useState<'my_code' | 'my_recruits' | 'team_rekap' | 'leaderboard' | 'flow'>('my_code');
  const [profile, setProfile] = useState<MyReferralProfile | null>(null);
  const [tracking, setTracking] = useState<ReferralTrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [searchRecruit, setSearchRecruit] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profData, trackData] = await Promise.all([
        referralService.getMyReferralProfile(),
        referralService.getReferralTracking(),
      ]);
      setProfile(profData);
      setTracking(trackData);
    } catch (err) {
      console.error('Gagal memuat data referral:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const referralCode = profile?.kodeReferral || `NSD-${session.role.substring(0, 3)}-SUPER`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = useMemo(() => {
    return encodeURIComponent(
      `Halo! Mari bergabung dalam perjuangan Gerakan Perubahan bersama PARTAI NASDEM SULAWESI UTARA 💙🧡\n\n` +
      `Saya merekrut Anda melalui jalur resmi kepengurusan Partai NasDem. Gunakan kode referral resmi saya saat pendaftaran:\n\n` +
      `👉 KODE REFERRAL: *${referralCode}*\n` +
      `👤 Perekrut: ${profile?.namaLengkap || session.adminName} (${profile?.jabatan || session.jabatan})\n\n` +
      `Bersatu, Berjuang, Menang! 🇮🇩`
    );
  }, [referralCode, profile, session]);

  const handleShareWa = () => {
    window.open(`https://wa.me/?text=${shareText}`, '_blank');
  };

  const isLeader = tracking?.myStats.isLeader || session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_DPW' || session.role === 'ADMIN_DPD';

  const filteredMyRecruits = useMemo(() => {
    if (!tracking?.myRecruits) return [];
    if (!searchRecruit.trim()) return tracking.myRecruits;
    const q = searchRecruit.toLowerCase();
    return tracking.myRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        m.dpd.toLowerCase().includes(q) ||
        m.dpc.toLowerCase().includes(q)
    );
  }, [tracking?.myRecruits, searchRecruit]);

  const filteredTeamRecruits = useMemo(() => {
    if (!tracking?.teamRecruits) return [];
    if (!searchRecruit.trim()) return tracking.teamRecruits;
    const q = searchRecruit.toLowerCase();
    return tracking.teamRecruits.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nik.includes(q) ||
        (m.kaderPerekrutNama && m.kaderPerekrutNama.toLowerCase().includes(q)) ||
        m.dpd.toLowerCase().includes(q)
    );
  }, [tracking?.teamRecruits, searchRecruit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 z-10 flex flex-col max-h-[92vh]">
        {/* Header Ribbon NasDem */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 p-5 sm:p-6 text-white border-b border-amber-500/20 relative overflow-hidden flex-shrink-0">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 font-black text-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Pusat Kode Referral & Rekrutmen Kader
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Resmi DPW
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Sistem Perekrutan Berjenjang Partai NasDem Sulawesi Utara dengan Atribusi Hierarkis Otomatis
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar pt-1 border-t border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('my_code')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'my_code'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Kode Referral Saya</span>
            </button>

            <button
              onClick={() => setActiveTab('my_recruits')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'my_recruits'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rekrutmen Saya ({tracking?.myStats.totalDirect || 0})</span>
            </button>

            {isLeader && (
              <button
                onClick={() => setActiveTab('team_rekap')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'team_rekap'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Supervisi Tim ({tracking?.myStats.totalTeam || 0})</span>
              </button>
            )}

            {isLeader && (
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'leaderboard'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Leaderboard Perekrut</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('flow')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'flow'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Alur Sistem</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Memuat identitas referral & hierarki ketua langsung...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: KODE REFERRAL SAYA */}
              {activeTab === 'my_code' && (
                <div className="space-y-6">
                  {/* Glowing Referral Card */}
                  <div className="relative rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-700/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-3 text-center md:text-left flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Kode Referral Resmi Pengurus</span>
                        </div>

                        <div>
                          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">
                            Kode Unik Anda:
                          </span>
                          <div className="inline-block bg-slate-950/80 border-2 border-amber-400/80 rounded-2xl px-6 py-2.5 font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-300 shadow-inner">
                            {referralCode}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                          Gunakan kode ini untuk merekrut kader baru. Anggota yang mendaftar menggunakan kode ini otomatis tercatat di bawah nama Anda dan dilaporkan ke Ketua Langsung.
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto flex-shrink-0">
                        <button
                          onClick={handleCopyCode}
                          className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all active:scale-95"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-950" />
                              <span>Kode Berhasil Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Salin Kode Referral</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleShareWa}
                          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Bagikan via WhatsApp</span>
                        </button>

                        <button
                          onClick={() => setShowQr(!showQr)}
                          className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-white/15"
                        >
                          <QrCode className="w-4 h-4 text-amber-300" />
                          <span>{showQr ? 'Tutup QR Code' : 'Tampilkan QR Code'}</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code Pop-Down */}
                    {showQr && (
                      <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center justify-center animate-in fade-in duration-300 text-center">
                        <div className="p-3 bg-white rounded-2xl shadow-2xl">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `NASDEM-REF:${referralCode}`
                            )}`}
                            alt="QR Referral"
                            className="w-40 h-40 rounded-lg"
                          />
                        </div>
                        <p className="text-xs text-slate-300 mt-2 font-medium">
                          Scan barcode ini untuk mendaftar langsung dengan kode <strong className="text-amber-300">{referralCode}</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hierarchical Attribution Card (Ketua Langsung) */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Atribusi Struktur & Ketua Langsung
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Otomatis Terverifikasi</span>
                      </span>
                    </div>

                    <div className={`grid grid-cols-1 ${profile?.ketuaLangsung && session.role !== 'SUPER_ADMIN' ? 'md:grid-cols-2' : ''} gap-4`}>
                      {/* Perekrut (Akun ini) */}
                      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                          Perekrut Langsung (Anda)
                        </span>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {profile?.namaLengkap || session.adminName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {profile?.jabatan || session.jabatan}
                        </p>
                        <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>
                            {profile?.dpd || session.dpdAccess} {profile?.dpc && profile.dpc !== '-' ? `• Kec. ${profile.dpc}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Ketua Langsung (Hanya jika memiliki pimpinan supervisi & bukan Super Admin) */}
                      {profile?.ketuaLangsung && session.role !== 'SUPER_ADMIN' && (
                        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                            Ketua Langsung Terkait (Supervisi)
                          </span>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {profile.ketuaLangsung.nama || 'Ketua DPW Partai NasDem Sulut'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {profile.ketuaLangsung.jabatan || 'Ketua DPW'}
                          </p>
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                            <Shield className="w-3 h-3 text-amber-500" />
                            <span>Tingkat Kepengurusan: {profile.ketuaLangsung.tingkat || 'DPW'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Aturan Sistem:</strong> Pengurus cukup menggunakan kode referral miliknya sendiri. Sistem secara otomatis mengenali Ketua Langsung di atasnya (DPRt &rarr; DPC &rarr; DPD &rarr; DPW). Rekapitulasi perekrutan tetap diatribusikan kepada perekrut langsung, sedangkan ketua langsung menerima rekapitulasi tim untuk fungsi pengawasan.
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Total Perekrutan Saya
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500">
                        {tracking?.myStats.totalDirect || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Kader Terdaftar</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Status Kepengurusan
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                        {profile?.tingkatKepengurusan || 'DPD'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Aktif Resmi</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center col-span-2 sm:col-span-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Supervisi Tim
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {tracking?.myStats.totalTeam || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Total Anggota Binaan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PEREKRUTAN SAYA (TRACKING PRIBADI) */}
              {activeTab === 'my_recruits' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Daftar Anggota yang Anda Rekrut
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Menampilkan seluruh kader baru yang mendaftar menggunakan kode referral Anda.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchRecruit}
                        onChange={(e) => setSearchRecruit(e.target.value)}
                        placeholder="Cari nama / NIK..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {filteredMyRecruits.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 p-4">
                      <Users className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Belum Ada Anggota yang Mendaftar dengan Kode Ini
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Bagikan kode referral Anda ke WhatsApp atau perlihatkan QR code saat konsolidasi partai di wilayah Anda.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-3">Nama Kader</th>
                              <th className="p-3">NIK & E-KTA</th>
                              <th className="p-3">Wilayah Domisili</th>
                              <th className="p-3">Tanggal Bergabung</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredMyRecruits.map((m) => (
                              <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                  {m.namaLengkap}
                                </td>
                                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                                  <div>{m.nik}</div>
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400">{m.nomorEKTA || '-'}</div>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">
                                  <div>{m.dpd}</div>
                                  <div className="text-[10px] text-slate-400">{m.dpc} • {m.dprt}</div>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">
                                  {m.tanggalBergabung}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUPERVISI & REKAP TIM (KHUSUS KETUA / PIMPINAN) */}
              {activeTab === 'team_rekap' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                        Supervisi Pimpinan
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Rekapitulasi Anggota Binaan Tim ({tracking?.myStats.totalTeam || 0} Kader)
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Rekap seluruh anggota yang direkrut oleh para pengurus di bawah garis hierarki tanggung jawab Anda.
                      </p>
                    </div>
                  </div>

                  {filteredTeamRecruits.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 p-4">
                      <Layers className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Belum Ada Rekapitulasi Tim
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Perekrutan oleh pengurus ranting dan cabang akan otomatis terkumpul di sini secara hierarkis.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-3">Nama Kader</th>
                              <th className="p-3">Perekrut Langsung</th>
                              <th className="p-3">Wilayah</th>
                              <th className="p-3">Tanggal</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredTeamRecruits.map((m) => (
                              <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                  <div>{m.namaLengkap}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{m.nik}</div>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-amber-600 dark:text-amber-400">
                                    {m.kaderPerekrutNama || '-'}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{m.kaderPerekrutJabatan || 'Pengurus'}</div>
                                  {m.kaderPerekrutKodeReferral && (
                                    <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded">
                                      {m.kaderPerekrutKodeReferral}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">
                                  <div>{m.dpd}</div>
                                  <div className="text-[10px] text-slate-400">{m.dpc}</div>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">
                                  {m.tanggalBergabung}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LEADERBOARD PEREKRUT TERAKTIF */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Peringkat Pengurus Perekrut Teraktif
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Peringkat kader berdasarkan kontribusi perekrutan riil di wilayah kepengurusan Anda.
                    </p>
                  </div>

                  {(!tracking?.leaderboard || tracking.leaderboard.length === 0) ? (
                    <div className="py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                      <Award className="w-10 h-10 text-slate-400 mx-auto opacity-40 mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Belum Ada Data Leaderboard
                      </p>
                      <p className="text-xs text-slate-500">
                        Perekrutan akan dikalkulasi secara otomatis saat kode referral digunakan.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {tracking.leaderboard.map((entry, idx) => (
                        <div
                          key={entry.kodeReferral + idx}
                          className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-400 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-800'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </div>

                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {entry.nama}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span>{entry.jabatan}</span>
                                <span>•</span>
                                <span>{entry.dpd}</span>
                                <span>•</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                  {entry.kodeReferral}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black text-amber-500">
                              {entry.totalRekrut}
                            </span>
                            <span className="text-[10px] text-slate-400 block -mt-1 font-medium">Kader</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ALUR SISTEM */}
              {activeTab === 'flow' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl">
                    <h3 className="text-sm font-bold text-blue-950 dark:text-blue-200 mb-1">
                      6 Langkah Alur Perekrutan Resmi Kode Referral
                    </h3>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Sesuai pedoman operasional DPW Partai NasDem Sulawesi Utara.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      {
                        step: '1',
                        title: 'Pengurus Login',
                        desc: 'Sistem mengenali ID, jabatan, organisasi, dan ketua langsung pengurus secara otomatis.',
                      },
                      {
                        step: '2',
                        title: 'Buka Fitur Referral',
                        desc: 'Sistem menampilkan kode unik pengurus (misal: NSD-DPC-5ZXF) beserta QR Code.',
                      },
                      {
                        step: '3',
                        title: 'Merekrut Anggota',
                        desc: 'Pengurus membagikan kode referral ke calon anggota atau via tautan WhatsApp.',
                      },
                      {
                        step: '4',
                        title: 'Sistem Memvalidasi',
                        desc: 'Sistem memvalidasi pemilik kode, organisasi, jabatan, dan menetapkan Ketua Langsung.',
                      },
                      {
                        step: '5',
                        title: 'Perekrutan Dicatat',
                        desc: 'Database mencatat anggota baru, ID Perekrut, dan ID Ketua Langsung tanpa dobel hitung.',
                      },
                      {
                        step: '6',
                        title: 'Tracking Dashboard',
                        desc: 'Perekrut melihat capaian pribadinya, dan pimpinan melihat rekap tim di wilayahnya.',
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                          {item.step}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Sistem Terintegrasi Partai NasDem Sulawesi Utara</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
