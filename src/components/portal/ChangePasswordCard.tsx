import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Lock, AtSign } from 'lucide-react';
import { UserSession } from '../../types';
import { UserService } from '../../services/userService';

interface ChangePasswordCardProps {
  session?: UserSession;
  onSessionUpdated?: (session: UserSession) => void;
}

const USERNAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{2,28}[A-Za-z0-9]$/;

export const ChangePasswordCard: React.FC<ChangePasswordCardProps> = ({
  session,
  onSessionUpdated,
}) => {
  // --- Username Login Kustom ---
  const currentLoginUsername = session?.username || session?.adminNik || '';
  const isUsingNikAsUsername =
    Boolean(session?.adminNik && currentLoginUsername === session.adminNik);
  const [newUsername, setNewUsername] = useState(
    isUsingNikAsUsername ? '' : currentLoginUsername
  );
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);

  useEffect(() => {
    const cur = session?.username || session?.adminNik || '';
    const usingNik = Boolean(session?.adminNik && cur === session.adminNik);
    setNewUsername(usingNik ? '' : cur);
  }, [session?.username, session?.adminNik]);

  // --- Ubah Kata Sandi ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    const clean = newUsername.trim();
    if (clean.length < 4 || clean.length > 30) {
      setUsernameError('Username harus terdiri dari 4 hingga 30 karakter.');
      return;
    }
    if (!USERNAME_REGEX.test(clean)) {
      setUsernameError(
        'Username hanya boleh huruf, angka, titik (.), garis bawah (_), atau tanda hubung (-) tanpa spasi.'
      );
      return;
    }

    setIsSavingUsername(true);
    try {
      const res = await UserService.changeUsername(clean);
      if (res.success && res.session) {
        setUsernameSuccess(
          res.message || `Username login berhasil disimpan sebagai '${clean}'.`
        );
        onSessionUpdated?.(res.session);
      } else {
        setUsernameError(res.message || 'Gagal menyimpan username login.');
      }
    } catch (err: any) {
      setUsernameError(err.message || 'Terjadi kesalahan saat menyimpan username.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg('Kata sandi lama, kata sandi baru, dan konfirmasi wajib diisi.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    if (newPassword.trim() === oldPassword.trim()) {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await UserService.changePassword(oldPassword, newPassword, confirmPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Kata sandi berhasil diperbarui.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.message || 'Gagal memperbarui kata sandi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memperbarui kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-5">
      {/* Bagian 1: Username Login Pribadi */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A3282] text-white flex items-center justify-center shrink-0">
              <AtSign className="w-4 h-4 text-[#FFDD00]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Username Login Pribadi
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tambahkan atau ubah username singkat agar Anda bisa login tanpa perlu mengetik 16 digit NIK setiap kali masuk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {currentLoginUsername && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                  isUsingNikAsUsername
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <AtSign className="w-3 h-3" />
                <span>
                  {isUsingNikAsUsername ? 'Saat ini memakai NIK' : currentLoginUsername}
                </span>
              </span>
            )}
          </div>
        </div>

        {usernameError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{usernameError}</span>
          </div>
        )}

        {usernameSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{usernameSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="portal-custom-username"
              className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Username Login (4–30 karakter, tanpa spasi)
            </label>
            <div className="relative">
              <AtSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="portal-custom-username"
                type="text"
                autoComplete="off"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Contoh: budi.santoso atau ketua_amurang"
                maxLength={30}
                required
                className="w-full h-10 pl-8 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1A3282] outline-none font-mono transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingUsername}
            className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#1A3282] hover:bg-[#21409A] disabled:opacity-60 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            {isSavingUsername ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <AtSign className="w-3.5 h-3.5 text-[#FFDD00]" />
                <span>Simpan Username</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* Bagian 2: Keamanan Akun & Ubah Kata Sandi */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A3282] text-white flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-[#FFDD00]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Keamanan Akun &amp; Ubah Kata Sandi
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Untuk keamanan akun, masukkan kata sandi lama Anda sebelum membuat kata sandi baru.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold self-start sm:self-center shrink-0">
            <Lock className="w-3 h-3 text-[#1A3282] dark:text-[#FFDD00]" />
            Verifikasi Kata Sandi Lama Aktif
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label
                htmlFor="portal-old-password"
                className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Kata Sandi Lama *
              </label>
              <div className="relative">
                <input
                  id="portal-old-password"
                  type={showOld ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  required
                  className="w-full h-10 pl-3 pr-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1A3282] outline-none transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowOld((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showOld ? 'Sembunyikan kata sandi lama' : 'Tampilkan kata sandi lama'}
                >
                  {showOld ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="portal-new-password"
                className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Kata Sandi Baru *
              </label>
              <div className="relative">
                <input
                  id="portal-new-password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                  className="w-full h-10 pl-3 pr-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1A3282] outline-none transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showNew ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="portal-confirm-password"
                className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Konfirmasi Kata Sandi Baru *
              </label>
              <div className="relative">
                <input
                  id="portal-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  minLength={6}
                  required
                  className="w-full h-10 pl-3 pr-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#1A3282] outline-none transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showConfirm ? 'Sembunyikan konfirmasi sandi' : 'Tampilkan konfirmasi sandi'}
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1A3282] hover:bg-[#21409A] disabled:opacity-60 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-[#FFDD00]" />
                  <span>Simpan Kata Sandi Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
