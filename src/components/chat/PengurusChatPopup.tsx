import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minus,
  Maximize2,
  ShieldCheck,
  Shield,
  Sparkles,
  Lock,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  Users,
  Check,
  UserCheck,
} from 'lucide-react';
import { UserSession } from '../../types';
import { SupportMessage, ChatCategory, AdminTargetOption } from './types';
import { supportChatService } from './supportChatService';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInputBox } from './ChatInputBox';

interface PengurusChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
}

export const PengurusChatPopup: React.FC<PengurusChatPopupProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherTypingName, setOtherTypingName] = useState('');
  const [adminTargets, setAdminTargets] = useState<AdminTargetOption[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<AdminTargetOption | undefined>(undefined);
  const [isMobileAdminPickerOpen, setIsMobileAdminPickerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const threadId = session.adminNik || session.adminName || 'USER_THREAD';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (showLoader = false) => {
    if (!threadId) return;
    if (showLoader && messages.length === 0) setIsLoading(true);
    try {
      const data = await supportChatService.getMessages(threadId);
      // Mencegah kedip & re-render berulang: Merge pesan dan hanya ganti state jika ada perubahan nyata
      setMessages((prev) => {
        const map = new Map<string, SupportMessage>();
        prev.forEach((m) => {
          if (m?.id) map.set(m.id, m);
        });
        (data || []).forEach((m) => {
          if (m?.id) map.set(m.id, m);
        });
        const merged = Array.from(map.values()).sort((a, b) =>
          (a.createdAt || '').localeCompare(b.createdAt || '')
        );

        if (
          merged.length === prev.length &&
          merged.every((m, idx) => m.id === prev[idx]?.id && m.isRead === prev[idx]?.isRead)
        ) {
          return prev;
        }
        return merged;
      });

      // Tandai telah dibaca HANYA jika ada pesan baru yang belum dibaca dari Super Admin
      const hasUnread = (data || []).some((m) => m.recipientRole === 'PENGURUS' && !m.isRead);
      if (hasUnread) {
        supportChatService.markAsRead(threadId, session.role);
      }
    } catch (err) {
      console.warn('Gagal memuat pesan:', err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Ambil daftar admin tujuan untuk model Hybrid
      supportChatService.getSupportAdmins().then((targets) => {
        setAdminTargets(targets);
        if (!selectedTarget && targets.length > 0) {
          setSelectedTarget(targets[0]);
        }
      });

      // Load pertama kali tampilkan loader halus
      fetchMessages(true).finally(() => {
        scrollToBottom();
      });

      // 1. Polling tenang setiap 5 detik di latar belakang (tanpa loader/tanpa kedip)
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 5000);

      // 2. Berlangganan event pesan baru & sedang mengetik
      const unsubscribe = supportChatService.subscribe((event) => {
        if (event.threadId === threadId) {
          if (event.type === 'NEW_MESSAGE') {
            setIsOtherTyping(false);
            fetchMessages(false).finally(() => scrollToBottom());
          } else if (event.type === 'TYPING' && event.senderRole === 'SUPER_ADMIN') {
            setIsOtherTyping(true);
            setOtherTypingName(event.senderName || 'Admin DPW');
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 3000);
          }
        }
      });

      return () => {
        clearInterval(interval);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        unsubscribe();
      };
    }
  }, [isOpen, threadId]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages.length, isOpen, isMinimized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (
    text: string,
    category: ChatCategory,
    target?: AdminTargetOption
  ) => {
    const chosenTarget = target || selectedTarget;
    try {
      const newMsg = await supportChatService.sendMessage(
        {
          message: text,
          category,
          recipientNik: chosenTarget?.id === 'ALL_DPW' ? undefined : chosenTarget?.id,
          recipientName: chosenTarget?.name,
        },
        session,
        threadId
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
    }
  };

  if (!isOpen) return null;

  // 1. TAMPILAN SAAT DIMINIMALKAN (Floating Pill di pojok kanan bawah)
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999] transition-all duration-300 ease-out animate-in slide-in-from-bottom-3 fade-in">
        <div
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-[#1A3282] to-[#21409A] hover:from-[#152868] hover:to-[#1A3282] text-white px-4 py-2.5 rounded-full shadow-2xl border-2 border-[#FDB813] flex items-center gap-3 cursor-pointer group transform hover:scale-102 active:scale-98 transition-all"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-[#FFDD00]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#1A3282]" />
          </div>
          <div className="text-xs font-bold truncate max-w-[200px]">
            Chat Admin DPW ({selectedTarget?.name || 'Aktif'})
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
            title="Perbesar Layar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
            title="Tutup Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. TAMPILAN UTAMA: MODAL SETENGAH LAYAR DI DESKTOP DENGAN SIDEBAR PEMILIHAN ADMIN
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in cursor-default"
    >
      {/* Container Dialog Chat */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full sm:max-w-4xl lg:w-[860px] h-full sm:h-[640px] sm:max-h-[88vh] rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out animate-in zoom-in-95"
      >
        
        {/* HEADER UTAMA */}
        <div className="bg-gradient-to-r from-[#1A3282] via-[#21409A] to-[#1A3282] text-white px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between border-b-2 border-b-[#FDB813] shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Tombol kembali khusus layar HP */}
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/10 text-white cursor-pointer shrink-0"
              title="Tutup chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
                <img
                  src="/icons/apple-touch-icon.png"
                  alt="Admin DPW"
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white"
                title="Admin DPW Standby"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>Pusat Bantuan &amp; Chat Admin DPW</span>
                <Sparkles className="w-3.5 h-3.5 text-[#FFDD00]" />
              </div>
              <div className="text-[10px] text-blue-200 truncate flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
                <span className="truncate">
                  {selectedTarget?.isDefaultTeam
                    ? 'Tim Admin DPW Standby (Respon Cepat)'
                    : `Ditujukan ke: ${selectedTarget?.name || 'Admin DPW'}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 text-white/90 shrink-0">
            {/* Tombol Switch Admin khusus Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileAdminPickerOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 text-[11px] font-bold cursor-pointer transition-colors"
              title="Ganti Admin Tujuan"
            >
              <Users className="w-3.5 h-3.5 text-[#FFDD00]" />
              <span className="max-w-[110px] truncate">
                {selectedTarget?.isDefaultTeam ? 'Tim DPW' : selectedTarget?.name}
              </span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            <button
              onClick={() => fetchMessages()}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer touch-manipulation"
              title="Perbarui pesan"
            >
              <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Kecilkan Chat"
            >
              <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer touch-manipulation"
              title="Tutup obrolan"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* BODY SPLIT KONTEN (SIDEBAR ADMIN + RUANG CHAT) */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950">
          
          {/* KOLOM KIRI (DESKTOP): SIDEBAR PEMILIHAN ADMIN DENGAN SPACE LUAS */}
          <div className="hidden md:flex flex-col w-72 lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 p-3.5 shrink-0 overflow-y-auto space-y-2.5">
            <div className="px-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#1A3282] dark:text-amber-400" />
                  <span>Pilih Tujuan Admin</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  {adminTargets.length} OPSI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Pilih kemana pesan konsultasi / laporan Anda ingin disampaikan.
              </p>
            </div>

            {/* List Kartu Admin */}
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
              {adminTargets.map((adm) => {
                const isSelected = selectedTarget?.id === adm.id;
                return (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => setSelectedTarget(adm)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1A3282] text-white border-[#FDB813] shadow-md ring-2 ring-[#FDB813]/40'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                          {adm.isDefaultTeam ? '🏢' : '🛡️'}
                        </span>
                        <div className="font-bold text-xs truncate">
                          {adm.name}
                        </div>
                      </div>
                      {adm.isDefaultTeam ? (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-tight shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          RESPON CEPAT
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                            isSelected
                              ? 'bg-blue-800 text-blue-100 border border-blue-600'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {adm.role === 'SUPER_ADMIN' ? 'SUPER' : 'ADMIN'}
                        </span>
                      )}
                    </div>

                    <div
                      className={`text-[10px] mt-1.5 line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-blue-100/90' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {adm.jabatan || 'Admin Penanggung Jawab Wilayah DPW'}
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-1.5 border-t border-white/20 flex items-center justify-between text-[10px] text-amber-300 font-bold">
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#FFDD00]" />
                          <span>Admin Terpilih</span>
                        </span>
                        <span className="text-[9px] text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Siap Menerima
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footnote Keamanan & Info */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-[10px] text-slate-600 dark:text-blue-300 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-[#1A3282] dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong>Privasi Terjamin:</strong> Pesan Anda hanya dapat diakses oleh Anda dan admin DPW yang berwenang.
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: RUANG CHAT UTAMA */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
            
            {/* Banner Info Admin yang Sedang Aktif */}
            <div className="px-3.5 py-1.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="font-semibold text-slate-500 dark:text-slate-400">Tujuan:</span>
                <strong className="text-[#1A3282] dark:text-amber-300 font-bold truncate">
                  {selectedTarget?.name || 'Tim Admin DPW Standby'}
                </strong>
                {selectedTarget?.isDefaultTeam && (
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                    SEMUA ADMIN AKTIF
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Enkripsi TLS 256-bit
              </div>
            </div>

            {/* List Pesan Bubble */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-1.5 bg-slate-50/40 dark:bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-[#1A3282] dark:text-blue-300 shadow-xs">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Belum ada percakapan
                  </h4>
                  <p className="text-[11px] sm:text-xs max-w-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Sampaikan keluhan, pertanyaan data NIK, penerbitan e-KTA DPP, atau permohonan SK kepengurusan langsung ke{' '}
                    <strong>{selectedTarget?.name || 'Admin DPW'}</strong>.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isMyMessage={msg.senderRole !== 'SUPER_ADMIN'}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Indikator Sedang Mengetik */}
            {isOtherTyping && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-[#1A3282] dark:text-amber-300 font-medium animate-in fade-in duration-150">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A3282] dark:bg-amber-400 animate-bounce [animation-delay:0s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A3282] dark:bg-amber-400 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A3282] dark:bg-amber-400 animate-bounce [animation-delay:0.3s]" />
                </div>
                <span>{otherTypingName || selectedTarget?.name || 'Admin DPW'} sedang mengetik...</span>
              </div>
            )}

            {/* Form Input Pesan */}
            <ChatInputBox
              onSendMessage={handleSendMessage}
              onTyping={() => supportChatService.sendTyping(threadId, session.adminName, session.role)}
              adminTargets={adminTargets}
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
            />
          </div>
        </div>
      </div>

      {/* DRAWER / BOTTOM SHEET PEMILIHAN ADMIN KHUSUS MOBILE */}
      {isMobileAdminPickerOpen && (
        <div className="md:hidden fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end p-2 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[80vh] flex flex-col space-y-3 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1A3282] dark:text-amber-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pilih Admin Tujuan Chat
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileAdminPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {adminTargets.map((adm) => {
                const isSelected = selectedTarget?.id === adm.id;
                return (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => {
                      setSelectedTarget(adm);
                      setIsMobileAdminPickerOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-[#1A3282] text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-xl mt-0.5">
                      {adm.isDefaultTeam ? '🏢' : '🛡️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span className="truncate">{adm.name}</span>
                        {adm.isDefaultTeam && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                            CEPAT
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 line-clamp-2 ${
                          isSelected ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {adm.jabatan || 'Admin DPW'}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#FFDD00] shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
