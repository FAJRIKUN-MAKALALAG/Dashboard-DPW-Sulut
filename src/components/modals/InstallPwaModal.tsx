import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Laptop,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isAndroid: boolean;
  onTriggerInstall: () => Promise<'accepted' | 'dismissed' | 'manual'>;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIos,
  isAndroid,
  onTriggerInstall,
}) => {
  // Tab aktif: prioritaskan platform yang terdeteksi
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isIos) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, [isIos, isAndroid, isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setIsInstalling(true);
    try {
      const res = await onTriggerInstall();
      if (res === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1A3282] via-[#21409A] to-[#1A3282] text-white p-4 sm:p-5 border-b-2 border-b-[#FDB813]">
          {/* Ornamen Latar */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute bottom-0 right-16 -mb-6 w-20 h-20 rounded-full bg-[#FDB813]/20 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/icons/apple-touch-icon.png"
                  alt="Logo NasDem Sulut"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[#FFDD00] text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Aplikasi Resmi Web (PWA)</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Pasang di Layar Utama HP
                </h3>
                <p className="text-xs text-blue-100/90 mt-0.5">
                  Akses 1-klik untuk Pengurus Partai NasDem Sulut
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              title="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Pemilihan Perangkat */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-800 text-[#1A3282] dark:text-blue-300 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
            {isAndroid && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Perangkat Anda" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-800 text-[#1A3282] dark:text-blue-300 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
            {isIos && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Perangkat Anda" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-800 text-[#1A3282] dark:text-blue-300 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptop / PC</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Preview Tampilan Ikon di HP */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <img
                src="/icons/apple-touch-icon.png"
                alt="Shortcut Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                NasDem Sulut
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                NasDem Digital Sulut (DPW)
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="w-3 h-3 text-[#1A3282] dark:text-blue-400" />
                  <span>Gratis &amp; Hemat Kuota</span>
                </span>
                {isInstalled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Terpasang
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sukses Notifikasi */}
          {installSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aplikasi berhasil dipasang! Cek layar utama HP Anda sekarang.</span>
            </div>
          )}

          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Tombol Install Otomatis Jika Browser Mendukung */}
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  disabled={isInstalling}
                  className="w-full py-3 px-4 rounded-2xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors disabled:opacity-60"
                >
                  <Download className={`w-4 h-4 text-[#FFDD00] ${isInstalling ? 'animate-bounce' : ''}`} />
                  <span>{isInstalling ? 'Menyiapkan pemasangan...' : '📲 Install Aplikasi Sekarang'}</span>
                </button>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Petunjuk Pasang di HP Android (Google Chrome):</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Buka situs web ini di browser <strong>Google Chrome</strong> di HP Anda.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Ketuk ikon <strong>Titik Tiga (⋮)</strong> di pojok kanan atas layar Chrome.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home Screen</em>).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      Ketuk <strong>"Instal"</strong>. Ikon resmi <strong>NasDem Sulut</strong> langsung tampil di menu aplikasi HP Anda!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IPHONE (iOS SAFARI) */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
                <strong>Catatan iPhone:</strong> Pastikan Anda membuka web ini menggunakan browser bawaan <strong>Safari</strong> (bukan dari browser dalam WhatsApp).
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Cara Pasang di iPhone / iPad (Safari):</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <span className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">⎋</span> di bilah bawah Safari).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Gulir ke bawah dan ketuk opsi <strong>"Tambah ke Layar Utama"</strong> (<em>Add to Home Screen</em>).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Pastikan namanya <strong>"NasDem Sulut"</strong>, lalu ketuk tombol <strong>"Tambah" (Add)</strong> di pojok kanan atas.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      Selesai! Ikon <strong>NasDem Sulut</strong> langsung tampil di layar depan iPhone layaknya aplikasi App Store.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP / LAPTOP */}
          {activeTab === 'desktop' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  disabled={isInstalling}
                  className="w-full py-3 px-4 rounded-2xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors disabled:opacity-60"
                >
                  <Download className="w-4 h-4 text-[#FFDD00]" />
                  <span>Install Aplikasi di Komputer / Laptop</span>
                </button>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Cara Pasang di Laptop (Chrome / Edge):
                </h4>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Lihat bilah alamat (URL bar) di atas, klik ikon <strong>Install Aplikasi</strong> di sebelah kanan ikon bintang bookmark.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#1A3282] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Klik <strong>"Instal"</strong>. Web ini akan terbuka di jendela tersendiri tanpa tab browser dan shortcut desktop akan dibuat otomatis.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keuntungan Memasang Aplikasi */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Keuntungan Aplikasi Shortcut:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Akses Cepat</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  1-klik buka langsung dari layar HP tanpa ketik link.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Layar Penuh</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tampilan fullscreen tanpa bilah alamat browser.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sesi 30 Hari</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Login tetap tersimpan aman tanpa sering ter-logout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 truncate">
            DPW Partai NasDem Sulawesi Utara
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
