import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'info';

export interface AlertDialogOptions {
  title?: string;
  message: string;
  detail?: string;
  variant?: DialogVariant;
  confirmText?: string;
}

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  detail?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface QueuedDialogItem {
  id: number;
  mode: 'alert' | 'confirm';
  title: string;
  message: string;
  detail?: string;
  variant: DialogVariant;
  confirmText: string;
  cancelText: string;
  resolve: (result: boolean) => void;
}

interface AppDialogContextValue {
  showAlert: (options: string | AlertDialogOptions) => Promise<void>;
  showConfirm: (options: string | ConfirmDialogOptions) => Promise<boolean>;
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export const useDialog = (): AppDialogContextValue => {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within an AppDialogProvider');
  }
  return ctx;
};

export const AppDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedDialogItem[]>([]);
  const nextIdRef = useRef<number>(1);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const activeDialog = queue[0] ?? null;

  const showAlert = useCallback((options: string | AlertDialogOptions): Promise<void> => {
    const normalized: AlertDialogOptions =
      typeof options === 'string' ? { message: options } : options;
    const variant: DialogVariant = normalized.variant || 'info';
    const defaultTitle =
      variant === 'danger'
        ? 'Terjadi Kendala'
        : variant === 'warning'
        ? 'Perhatian'
        : 'Informasi Sistem';

    return new Promise<void>((resolve) => {
      const id = nextIdRef.current++;
      setQueue((prev) => [
        ...prev,
        {
          id,
          mode: 'alert',
          title: normalized.title || defaultTitle,
          message: normalized.message,
          detail: normalized.detail,
          variant,
          confirmText: normalized.confirmText || 'Mengerti',
          cancelText: 'Tutup',
          resolve: () => resolve(),
        },
      ]);
    });
  }, []);

  const showConfirm = useCallback((options: string | ConfirmDialogOptions): Promise<boolean> => {
    const normalized: ConfirmDialogOptions =
      typeof options === 'string' ? { message: options } : options;
    const variant: DialogVariant = normalized.variant || 'warning';
    const defaultTitle =
      variant === 'danger' ? 'Konfirmasi Penghapusan' : 'Konfirmasi Tindakan';

    return new Promise<boolean>((resolve) => {
      const id = nextIdRef.current++;
      setQueue((prev) => [
        ...prev,
        {
          id,
          mode: 'confirm',
          title: normalized.title || defaultTitle,
          message: normalized.message,
          detail: normalized.detail,
          variant,
          confirmText:
            normalized.confirmText || (variant === 'danger' ? 'Ya, Hapus' : 'Ya, Lanjutkan'),
          cancelText: normalized.cancelText || 'Batal',
          resolve,
        },
      ]);
    });
  }, []);

  const closeActive = useCallback((confirmed: boolean) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [current, ...rest] = prev;
      // Resolve outside state updater microtask safely
      queueMicrotask(() => current.resolve(confirmed));
      return rest;
    });
  }, []);

  // Auto-focus primary button & bind Escape key when dialog opens
  useEffect(() => {
    if (!activeDialog) return;

    const timer = window.setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeDialog, closeActive]);

  const contextValue = useMemo<AppDialogContextValue>(
    () => ({ showAlert, showConfirm }),
    [showAlert, showConfirm]
  );

  const renderIcon = (variant: DialogVariant, mode: 'alert' | 'confirm') => {
    if (variant === 'danger') {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          {mode === 'confirm' ? (
            <Trash2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>
      );
    }

    if (variant === 'warning') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-[#1A3282]/10 dark:bg-slate-800 border border-[#1A3282]/20 dark:border-slate-700 flex items-center justify-center text-[#1A3282] dark:text-blue-400 shrink-0">
        <Info className="w-5 h-5" />
      </div>
    );
  };

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}
      {activeDialog &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/55 dark:bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`app-dialog-title-${activeDialog.id}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeActive(false);
              }
            }}
          >
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Top Body */}
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3.5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {renderIcon(activeDialog.variant, activeDialog.mode)}
                    <div className="min-w-0 pt-0.5">
                      <h3
                        id={`app-dialog-title-${activeDialog.id}`}
                        className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug"
                      >
                        {activeDialog.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {activeDialog.message}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => closeActive(false)}
                    className="p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    aria-label="Tutup dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeDialog.detail && (
                  <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono break-words">
                    {activeDialog.detail}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
                {activeDialog.mode === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => closeActive(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {activeDialog.cancelText}
                  </button>
                )}

                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={() => closeActive(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
                    activeDialog.variant === 'danger' && activeDialog.mode === 'confirm'
                      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                      : 'bg-[#1A3282] hover:bg-[#142768] dark:bg-[#21409A] dark:hover:bg-blue-700 focus:ring-[#1A3282]'
                  }`}
                >
                  {activeDialog.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </AppDialogContext.Provider>
  );
};

