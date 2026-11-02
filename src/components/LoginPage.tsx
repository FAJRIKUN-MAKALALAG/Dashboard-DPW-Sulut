import React, { useState } from 'react';
import { UserSession } from '../types';
import { UserService } from '../services/userService';
import nasdem15Logo from '../assets/logo/Ultah15th.png';
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Lock,
  IdCard,
  ChevronLeft,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Mode: 'login' (Masuk Akun) | 'activate' (Aktivasi / Buat Sandi Baru Pengurus)
  const [mode, setMode] = useState<'login' | 'activate'>('login');
  const [showHelp, setShowHelp] = useState(false);

  // --- State Form Login Normal ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- State Form Aktivasi Mandiri Pengurus ---
  const [actNik, setActNik] = useState('');
  const [actCheckedMember, setActCheckedMember] = useState<{
    found: boolean;
    nik: string;
    nomorEkta: string;
    namaLengkap: string;
    jabatan: string;
    tingkatKepengurusan: string;
    dpd: string;
    dpc: string;
    dprt: string;
    hasCustomPassword: boolean;
    defaultPasswordHint: string;
  } | null>(null);
  const [actNewPassword, setActNewPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [actShowPassword, setActShowPassword] = useState(false);
  const [actIsChecking, setActIsChecking] = useState(false);
  const [actIsSubmitting, setActIsSubmitting] = useState(false);
  const [actError, setActError] = useState<string | null>(null);
  const [actSuccessMsg, setActSuccessMsg] = useState<string | null>(null);

  const switchMode = (target: 'login' | 'activate') => {
    setMode(target);
    setErrorMsg(null);
    setActError(null);
    setShowHelp(false);
  };

  // Handler Submit Login Normal
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await UserService.authenticate(username.trim(), password);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(
          res.message ||
            'NIK / Nomor e-KTA atau kata sandi tidak sesuai. Silakan periksa kembali data login Anda.'
        );
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Terjadi kendala teknis saat memverifikasi akun. Silakan coba sesaat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Cek Status Pengurus (Aktivasi Tahap 1)
  const handleCheckPengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError(null);
    setActCheckedMember(null);
    setActSuccessMsg(null);

    const clean = actNik.replace(/[^0-9]/g, '').trim();
    if (!clean || clean.length < 12) {
      setActError('Masukkan 16 digit Nomor Induk Kependudukan (NIK) KTP Anda.');
      return;
    }

    setActIsChecking(true);
    try {
      const data = await UserService.checkPengurus(clean);
      if (data && data.found) {
        setActCheckedMember(data);
      } else {
        setActError('NIK Anda tidak ditemukan dalam database kepengurusan Partai NasDem Sulut.');
      }
    } catch (err: any) {
      setActError(
        err.message ||
          'NIK belum terdaftar dalam SK Kepengurusan Partai NasDem Sulawesi Utara. Hubungi Sekretariat DPW.'
      );
    } finally {
      setActIsChecking(false);
    }
  };

  // Handler Simpan Password & Aktivasi Pengurus (Aktivasi Tahap 2)
  const handleSubmitAktivasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError(null);

    if (!actCheckedMember) return;
    if (actNewPassword.length < 6) {
      setActError('Kata sandi baru minimal terdiri dari 6 karakter.');
      return;
    }
    if (actNewPassword !== actConfirmPassword) {
      setActError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setActIsSubmitting(true);
    try {
      const res = await UserService.activatePengurus(actCheckedMember.nik, actNewPassword);
      if (res.success && res.session) {
        setActSuccessMsg('Aktivasi berhasil. Mengalihkan ke portal...');
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 1000);
      } else {
        setActError(res.message || 'Gagal mengaktifkan akun pengurus.');
      }
    } catch (err: any) {
      setActError(err.message || 'Terjadi kesalahan sistem saat menyimpan kata sandi.');
    } finally {
      setActIsSubmitting(false);
    }
  };

  const cleanNikDigits = actNik.replace(/[^0-9]/g, '').length;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between items-center px-5 sm:px-10 lg:px-16 py-6 font-sans antialiased selection:bg-[#1A3282]/15 selection:text-[#1A3282]">
      <div className="w-full" />

      {/* Samping Kiri: Logo | Samping Kanan: Kartu Login & Aktivasi */}
      <main className="w-full max-w-6xl my-auto py-4 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-20">
        {/* SAMPING KIRI: Logo Utama & Identitas Wilayah */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left select-none">
          <img
            src={nasdem15Logo}
            alt="Logo 15 Tahun Partai NasDem"
            className="w-56 sm:w-72 md:w-[360px] lg:w-[470px] xl:w-[520px] max-h-[380px] object-contain"
          />

          <div className="mt-5 sm:mt-7 md:pl-2">
            <div className="w-12 h-1 bg-[#1A3282] rounded-full mb-3.5 mx-auto md:mx-0" />
            <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-[#1A3282] uppercase">
              DPW Partai NasDem Sulawesi Utara
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Sistem Informasi Manajemen Kader &amp; Struktur Kepengurusan Teritorial
            </p>
          </div>
        </div>

        {/* SAMPING KANAN: Kartu Form Login & Aktivasi Akun */}
        <div className="w-full max-w-[420px] md:w-[400px] lg:w-[430px] shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.09)] p-6 sm:p-8">
            {/* Tab Switcher Bersih (Tanpa Ikon Bintang) */}
            <div
              role="tablist"
              aria-label="Pilih Mode Akses"
              className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/60 mb-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#1A3282] font-bold shadow-2xs ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'activate'}
                onClick={() => switchMode('activate')}
                className={`py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                  mode === 'activate'
                    ? 'bg-white text-[#1A3282] font-bold shadow-2xs ring-1 ring-slate-200/70'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                Aktivasi Pengurus
              </button>
            </div>

            {/* ==================== TAB 1: MASUK AKUN ==================== */}
            {mode === 'login' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Portal Internal Pengurus
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Masuk menggunakan NIK KTP atau Nomor e-KTA terdaftar Anda.
                  </p>
                </div>

                <form onSubmit={handleSubmitLogin} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                  )}

                  {/* NIK / e-KTA */}
                  <div>
                    <label
                      htmlFor="login-username"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      NIK KTP / Nomor e-KTA
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <IdCard className="w-4 h-4" />
                      </div>
                      <input
                        id="login-username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Masukkan 16 digit NIK atau No. e-KTA"
                        className="w-full h-11 pl-10 pr-4 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A3282] focus:ring-3 focus:ring-[#1A3282]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Kata Sandi */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowHelp(!showHelp)}
                        className="text-[11px] text-[#1A3282] hover:text-[#21409A] font-semibold cursor-pointer hover:underline"
                      >
                        {showHelp ? 'Tutup panduan' : 'Lupa kata sandi?'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full h-11 pl-10 pr-10 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A3282] focus:ring-3 focus:ring-[#1A3282]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Info Bantuan Akses */}
                  {showHelp && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-slate-800">Panduan Akses Pengurus</p>
                      <p>
                        Bagi pengurus baru yang belum memiliki kata sandi, silakan buka tab{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('activate')}
                          className="font-semibold text-[#1A3282] hover:underline cursor-pointer"
                        >
                          Aktivasi Pengurus
                        </button>{' '}
                        untuk mengatur kata sandi mandiri menggunakan NIK KTP.
                      </p>
                      <p>
                        Apabila lupa kata sandi yang telah diatur, hubungi Administrator OKK / Bappilu DPW.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 px-4 rounded-xl bg-[#1A3282] hover:bg-[#152868] disabled:opacity-60 active:scale-[0.995] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1.5">
                    <span className="text-xs text-slate-500">Belum mengatur kata sandi? </span>
                    <button
                      type="button"
                      onClick={() => switchMode('activate')}
                      className="text-xs font-semibold text-[#1A3282] hover:underline cursor-pointer"
                    >
                      Aktivasi Akun
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==================== TAB 2: AKTIVASI PENGURUS ==================== */}
            {mode === 'activate' && (
              <div>
                {/* Indikator Tahap */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                    <span>
                      {actCheckedMember
                        ? 'Tahap 2 · Buat Kata Sandi Baru'
                        : 'Tahap 1 · Verifikasi NIK SK'}
                    </span>
                    <span className="font-mono text-slate-400">{actCheckedMember ? '2/2' : '1/2'}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-[#1A3282] transition-all duration-300 ${
                        actCheckedMember ? 'w-full' : 'w-1/2'
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Aktivasi Akun Pengurus
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {actCheckedMember
                      ? 'Buat kata sandi baru untuk akun kepengurusan Anda.'
                      : 'Masukkan NIK KTP untuk memverifikasi data SK DPW, DPD, DPC, atau DPRt.'}
                  </p>
                </div>

                {actError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{actError}</span>
                  </div>
                )}

                {actSuccessMsg && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{actSuccessMsg}</span>
                  </div>
                )}

                {/* TAHAP 1: CEK NIK */}
                {!actCheckedMember && (
                  <form onSubmit={handleCheckPengurus} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="activate-nik"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          NIK KTP Pengurus
                        </label>
                        <span className="text-[11px] font-mono text-slate-400">
                          {cleanNikDigits}/16 digit
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <IdCard className="w-4 h-4" />
                        </div>
                        <input
                          id="activate-nik"
                          type="text"
                          inputMode="numeric"
                          value={actNik}
                          onChange={(e) => setActNik(e.target.value)}
                          placeholder="Masukkan 16 digit NIK KTP"
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A3282] focus:ring-3 focus:ring-[#1A3282]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono"
                          required
                          maxLength={20}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        NIK akan dicocokkan otomatis dengan database SK Kepengurusan resmi.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={actIsChecking}
                      className="w-full h-11 px-4 rounded-xl bg-[#1A3282] hover:bg-[#152868] disabled:opacity-60 active:scale-[0.995] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {actIsChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memverifikasi Data SK...</span>
                        </>
                      ) : (
                        <>
                          <span>Verifikasi Status Pengurus</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1.5">
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#1A3282] font-medium cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke halaman masuk</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAHAP 2: ATUR KATA SANDI */}
                {actCheckedMember && (
                  <form onSubmit={handleSubmitAktivasi} className="space-y-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/80">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1A3282]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Data Pengurus Terverifikasi
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActCheckedMember(null);
                            setActNewPassword('');
                            setActConfirmPassword('');
                            setActError(null);
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                        >
                          Ubah NIK
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm text-slate-900">
                          {actCheckedMember.namaLengkap}
                        </p>
                        <p className="text-xs font-medium text-[#1A3282]">
                          {actCheckedMember.jabatan} &middot; Tingkat {actCheckedMember.tingkatKepengurusan}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Wilayah: {actCheckedMember.dpd}
                          {actCheckedMember.dpc && actCheckedMember.dpc !== '-'
                            ? ` / ${actCheckedMember.dpc}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="act-new-password"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="act-new-password"
                          type={actShowPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={actNewPassword}
                          onChange={(e) => setActNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="w-full h-11 pl-10 pr-10 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A3282] focus:ring-3 focus:ring-[#1A3282]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={actShowPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                          onClick={() => setActShowPassword(!actShowPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {actShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="act-confirm-password"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="act-confirm-password"
                          type={actShowPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={actConfirmPassword}
                          onChange={(e) => setActConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A3282] focus:ring-3 focus:ring-[#1A3282]/10 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActCheckedMember(null);
                          setActNewPassword('');
                          setActConfirmPassword('');
                          setActError(null);
                        }}
                        className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={actIsSubmitting}
                        className="flex-1 h-11 px-4 rounded-xl bg-[#1A3282] hover:bg-[#152868] disabled:opacity-60 active:scale-[0.995] text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {actIsSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <span>Aktifkan &amp; Masuk</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Catatan Keamanan */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Terhubung langsung ke SK &amp; Database Realtime DPW</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-[11px] text-slate-400 pt-6 pb-1">
        Dewan Pimpinan Wilayah (DPW) Partai NasDem Sulawesi Utara &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
