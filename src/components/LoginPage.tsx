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
  Sparkles,
  KeyRound,
  UserCheck,
  Building,
  Info,
  Lock,
  IdCard,
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

  // --- State Form Aktivasi Mandiri Pengurus (Opsi 1) ---
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

  // Handler Submit Login Normal (Mendukung Opsi 2: Password Default 6 Digit NIK / nasdem123)
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await UserService.authenticate(username, password);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMsg(res.message || 'NIK / Username atau Password salah. Silakan periksa kembali data login Anda.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Terjadi kendala teknis saat memverifikasi akun. Silakan coba sesaat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Cek Status Pengurus (Aktivasi Step 1)
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
        setActError('NIK Anda tidak ditemukan di database kepengurusan Partai NasDem Sulut.');
      }
    } catch (err: any) {
      setActError(err.message || 'NIK Anda belum terdaftar dalam SK Kepengurusan Partai NasDem Sulawesi Utara. Hubungi admin DPW.');
    } finally {
      setActIsChecking(false);
    }
  };

  // Handler Simpan Password & Aktivasi Pengurus (Aktivasi Step 2)
  const handleSubmitAktivasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError(null);

    if (!actCheckedMember) return;
    if (actNewPassword.length < 6) {
      setActError('Kata sandi baru minimal 6 karakter.');
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
        setActSuccessMsg('Aktivasi berhasil! Anda sedang dialihkan...');
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 1200);
      } else {
        setActError(res.message || 'Gagal mengaktivasi akun pengurus.');
      }
    } catch (err: any) {
      setActError(err.message || 'Terjadi kesalahan sistem saat menyimpan kata sandi.');
    } finally {
      setActIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between items-center p-4 sm:p-8 lg:p-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full" />

      {/* Main Container - Left & Right Columns */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-20 my-auto py-4">
        {/* Left Side: Large Anniversary Logo & Tagline */}
        <div className="flex-1 flex flex-col items-center justify-center text-center select-none">
          <div className="relative group p-2">
            <img
              src={nasdem15Logo}
              alt="Logo 15 Tahun Partai NasDem"
              className="w-44 sm:w-72 md:w-88 lg:w-[580px] max-h-[240px] sm:max-h-[500px] lg:max-h-[640px] object-contain drop-shadow-md transition-all duration-0"
            />
          </div>
          <div className="mt-3 sm:mt-6 space-y-1">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#002B49] uppercase">
              Partai NasDem
            </h1>
            <p className="text-[11px] sm:text-sm font-bold tracking-widest text-[#E31B23] uppercase">
              GERAKAN PERUBAHAN &middot; DPW SULAWESI UTARA
            </p>
          </div>
        </div>

        {/* Right Side: Login & Activation Card */}
        <div className="w-full max-w-sm sm:max-w-md flex flex-col">
          <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/80">
            {/* Header Tabs: Masuk vs Aktivasi Akun Pengurus */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setShowHelp(false);
                }}
                className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#002B49] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-[#002B49]" />
                <span>Masuk Akun</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('activate');
                  setActError(null);
                }}
                className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'activate'
                    ? 'bg-[#002B49] text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Aktivasi Pengurus</span>
              </button>
            </div>

            {/* TAB 1: FORM LOGIN NORMAL */}
            {mode === 'login' && (
              <>
                <div className="mb-5 text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-[#002B49] tracking-tight">
                    Portal Internal Pengurus
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Database Kader &amp; Struktur Kepengurusan DPW Sulut
                  </p>
                </div>

                <form onSubmit={handleSubmitLogin} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                  )}

                  {/* NIK / Username Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIK KTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <IdCard className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Contoh: 7105... atau No. e-KTA"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Kata Sandi (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowHelp(!showHelp)}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer hover:underline"
                      >
                        {showHelp ? 'Tutup Bantuan' : 'Lupa Password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Box Bantuan Lupa Password (Expandable) */}
                  {showHelp && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed animate-fadeIn space-y-1">
                      <p className="font-bold text-[#002B49]">Bantuan Masuk &amp; Sandi:</p>
                      <p className="text-[11px] text-slate-600">
                        Jika Anda lupa kata sandi atau merupakan pengurus baru, silakan gunakan menu{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('activate');
                            setShowHelp(false);
                          }}
                          className="font-bold text-blue-700 underline hover:text-blue-900 cursor-pointer"
                        >
                          Aktivasi Pengurus &raquo;
                        </button>{' '}
                        untuk memverifikasi NIK KTP dan membuat kata sandi baru secara mandiri.
                      </p>
                    </div>
                  )}

                  {/* Petunjuk Sandi Awal Pengurus Baru */}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#002B49] hover:bg-[#001d32] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk Sekarang</span>
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <span className="text-xs text-slate-500">Ingin buat sandi baru mandiri? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('activate');
                        setErrorMsg(null);
                        setShowHelp(false);
                      }}
                      className="text-xs font-bold text-[#002B49] hover:underline cursor-pointer"
                    >
                      Aktivasi Akun &raquo;
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* TAB 2: AKTIVASI MANDIRI PENGURUS (OPSI 1) */}
            {mode === 'activate' && (
              <div>
                <div className="mb-4 text-center">
                  <h2 className="text-xl sm:text-2xl font-black text-[#002B49] tracking-tight">
                    Aktivasi Akun Pengurus
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Buat kata sandi mandiri untuk DPW, DPD, DPC, atau DPRt
                  </p>
                </div>

                {actError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{actError}</span>
                  </div>
                )}

                {actSuccessMsg && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{actSuccessMsg}</span>
                  </div>
                )}

                {/* STEP 1: CEK NIK PENGURUS */}
                {!actCheckedMember && (
                  <form onSubmit={handleCheckPengurus} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nomor Induk Kependudukan (NIK KTP)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <IdCard className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={actNik}
                          onChange={(e) => setActNik(e.target.value)}
                          placeholder="Contoh: 7105011204850003"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-mono"
                          required
                          maxLength={20}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Sistem akan memverifikasi apakah NIK Anda tercatat dalam SK Kepengurusan resmi.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={actIsChecking}
                      className="w-full py-3 px-4 rounded-xl bg-[#002B49] hover:bg-[#001d32] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {actIsChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Mengecek Database SK...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <span>Cek Status Pengurus</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setActError(null);
                        }}
                        className="text-xs text-slate-500 hover:text-[#002B49] hover:underline font-semibold cursor-pointer"
                      >
                        &laquo; Kembali ke Halaman Masuk
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: NIK DITEMUKAN -> BUAT KATA SANDI BARU */}
                {actCheckedMember && (
                  <form onSubmit={handleSubmitAktivasi} className="space-y-4">
                    {/* Info Card Pengurus Terdeteksi */}
                    <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-300 rounded-xl">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Data Pengurus Teridentifikasi</span>
                      </div>
                      <div className="text-xs text-slate-800 space-y-0.5 mt-2">
                        <p className="font-extrabold text-sm text-slate-900">
                          {actCheckedMember.namaLengkap}
                        </p>
                        <p className="text-amber-800 font-semibold">
                          {actCheckedMember.jabatan} &middot; Tingkat {actCheckedMember.tingkatKepengurusan}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Wilayah: {actCheckedMember.dpd} {actCheckedMember.dpc !== '-' ? ` / ${actCheckedMember.dpc}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Input Password Baru */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Buat Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={actShowPassword ? 'text' : 'password'}
                          value={actNewPassword}
                          onChange={(e) => setActNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter..."
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setActShowPassword(!actShowPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {actShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ulangi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={actShowPassword ? 'text' : 'password'}
                          value={actConfirmPassword}
                          onChange={(e) => setActConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi..."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#002B49] focus:ring-1 focus:ring-[#002B49] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActCheckedMember(null);
                          setActNewPassword('');
                          setActConfirmPassword('');
                        }}
                        className="px-4 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={actIsSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {actIsSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyimpan Akun...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4 text-emerald-200" />
                            <span>Aktifkan &amp; Masuk</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Info Keamanan Super Admin */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Akses pengurus terhubung otomatis ke SK &amp; Database Realtime DPW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full text-center text-xs text-slate-400 pt-8 pb-2">
        Dewan Pimpinan Wilayah (DPW) Partai NasDem Sulawesi Utara &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
