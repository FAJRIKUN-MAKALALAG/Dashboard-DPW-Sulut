import React, { useState } from 'react';
import { UserSession } from '../types';
import { DUMMY_ACCOUNTS, AuthAccount } from '../data/dummyAccounts';
import nasdem15Logo from '../assets/logo/Ultah15th.png';
import {
  Lock,
  User,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSimulations, setShowSimulations] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const found = DUMMY_ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === username.trim().toLowerCase() &&
        acc.password === password
    );

    if (found) {
      onLoginSuccess(found.session);
    } else {
      setErrorMsg('Username atau password salah. Silakan coba lagi atau pilih akun simulasi di bawah.');
    }
  };

  const handleQuickLogin = (account: AuthAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setErrorMsg(null);
    onLoginSuccess(account.session);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between items-center p-6 sm:p-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full" />

      {/* Main Container - Left & Right Columns */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 my-auto">
        {/* Left Side: Large Anniversary Logo & Tagline */}
        <div className="flex-1 flex flex-col items-center justify-center text-center select-none">
          <div className="relative group p-2">
            <img
              src={nasdem15Logo}
              alt="Logo 15 Tahun Partai NasDem"
              className="w-64 sm:w-80 md:w-96 lg:w-[620px] max-h-[660px] object-contain drop-shadow-md transition-all duration-0 group-hover:0"
            />
          </div>
          <div className="mt-6 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#002B49] uppercase">
              Partai NasDem
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-[#E31B23] uppercase">
              GERAKAN PERUBAHAN
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-sm sm:max-w-md flex flex-col">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/80">
            <h2 className="text-xl sm:text-2xl font-bold text-[#002B49] text-center mb-6 tracking-tight">
              Login / Masuk
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Username/Email Input */}
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="fajrikunmakalalag@gmail.com / Username"
                  className="w-full px-4 py-2.5 bg-[#eef3f9] hover:bg-[#e9eff7] focus:bg-white border border-transparent focus:border-sky-400 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-4 pr-10 py-2.5 bg-[#eef3f9] hover:bg-[#e9eff7] focus:bg-white border border-transparent focus:border-sky-400 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setErrorMsg('Fitur reset password dapat diakses melalui sekretariat DPW.')}
                    className="text-xs text-[#0095f6] hover:underline font-medium cursor-pointer"
                  >
                    Lupa Password ?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[#0095f6] hover:bg-[#0084dc] active:bg-[#0074c2] text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 mt-2"
              >
                <span>Login / Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Helper links matching the design reference */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
              <p>
                Belum Jadi Kader NasDem?{' '}
                <span className="text-[#0095f6] font-semibold cursor-pointer hover:underline">
                  Daftar
                </span>
              </p>
              <p>
                Sudah Jadi Kader NasDem?{' '}
                <span className="text-[#0095f6] font-semibold cursor-pointer hover:underline">
                  Lupa E-KTA
                </span>
              </p>
            </div>

            {/* Quick Testing Accounts Section for Roles */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSimulations(!showSimulations)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider hover:text-blue-600 transition-colors cursor-pointer py-1"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Akses Cepat Akun Simulasi</span>
                </span>
                {showSimulations ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showSimulations && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] text-slate-400 font-mono text-right">
                    Password default: nasdem123
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DUMMY_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickLogin(acc)}
                        className="text-left p-2.5 rounded-lg border border-slate-200/80 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition-colors">
                              {acc.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                              {acc.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            User: <strong className="text-slate-700 font-mono">{acc.username}</strong> &middot; {acc.description}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
