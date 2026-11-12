import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  MessageSquare,
  Shield,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { UserSession } from '../../types';
import { SupportThread, SupportMessage } from './types';
import { supportChatService } from './supportChatService';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInputBox } from './ChatInputBox';

interface SuperAdminChatInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
}

export const SuperAdminChatInboxModal: React.FC<SuperAdminChatInboxModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPengurusTyping, setIsPengurusTyping] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchThreads = async (showLoader = false) => {
    if (showLoader && threads.length === 0) setIsLoadingThreads(true);
    try {
      const data = await supportChatService.getThreads();
      setThreads((prev) => {
        if (
          prev.length === data.length &&
          prev.every(
            (t, i) =>
              t.threadId === data[i]?.threadId &&
              t.unreadCount === data[i]?.unreadCount &&
              t.lastMessageTime === data[i]?.lastMessageTime
          )
        ) {
          return prev;
        }
        return data;
      });
      if (data.length > 0 && !selectedThread) {
        setSelectedThread(data[0]);
      }
    } finally {
      if (showLoader) setIsLoadingThreads(false);
    }
  };

  const fetchMessagesForThread = async (threadId: string, showLoader = false) => {
    if (showLoader && messages.length === 0) setIsLoadingMessages(true);
    try {
      const data = await supportChatService.getMessages(threadId);
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

      const hasUnread = (data || []).some((m) => m.recipientRole === 'SUPER_ADMIN' && !m.isRead);
      if (hasUnread) {
        supportChatService.markAsRead(threadId, 'SUPER_ADMIN');
        // Update local unread counter
        setThreads((prev) =>
          prev.map((t) => (t.threadId === threadId ? { ...t, unreadCount: 0 } : t))
        );
      }
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchThreads(threads.length === 0);
      // Polling threads setiap 5 detik di background secara senyap
      const interval = setInterval(() => fetchThreads(false), 5000);

      // Listener real-time instan: pesan baru & status mengetik
      const unsubscribe = supportChatService.subscribe((event) => {
        if (event.type === 'NEW_MESSAGE') {
          fetchThreads(false);
          if (selectedThread && event.threadId === selectedThread.threadId) {
            setIsPengurusTyping(false);
            fetchMessagesForThread(selectedThread.threadId, false);
          }
        } else if (
          event.type === 'TYPING' &&
          selectedThread &&
          event.threadId === selectedThread.threadId &&
          event.senderRole !== 'SUPER_ADMIN'
        ) {
          setIsPengurusTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsPengurusTyping(false);
          }, 3000);
        }
      });

      return () => {
        clearInterval(interval);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        unsubscribe();
      };
    }
  }, [isOpen, selectedThread?.threadId]);

  useEffect(() => {
    if (selectedThread && isOpen) {
      fetchMessagesForThread(selectedThread.threadId, true);
      // Polling pesan thread aktif setiap 4 detik secara senyap tanpa loader kedip
      const msgInterval = setInterval(() => {
        fetchMessagesForThread(selectedThread.threadId, false);
      }, 4000);
      return () => clearInterval(msgInterval);
    }
  }, [selectedThread?.threadId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!selectedThread) return;
    try {
      const newMsg = await supportChatService.sendMessage(
        {
          message: text,
          recipientNik: selectedThread.pengurusNik,
        },
        session,
        selectedThread.threadId
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      // Update last message in threads list
      setThreads((prev) =>
        prev.map((t) =>
          t.threadId === selectedThread.threadId
            ? { ...t, lastMessage: text, lastMessageTime: new Date().toISOString() }
            : t
        )
      );
    } catch (err) {
      console.error('Gagal membalas pesan:', err);
    }
  };

  if (!isOpen) return null;

  const filteredThreads = threads.filter(
    (t) =>
      t.pengurusName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pengurusDpd.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.pengurusJabatan && t.pengurusJabatan.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatThreadTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-full sm:h-[86vh] bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#1A3282] via-[#21409A] to-[#1A3282] text-white p-3.5 sm:p-5 flex items-center justify-between border-b-2 border-b-[#FDB813] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <img
                src="/icons/apple-touch-icon.png"
                alt="Logo NasDem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-base font-black text-white truncate">
                  Pusat Pesan Pengurus (Helpdesk Super Admin)
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#FDB813] text-slate-950 shrink-0">
                  MASTER INBOX
                </span>
              </div>
              <p className="hidden sm:block text-xs text-blue-100/90 mt-0.5 truncate">
                Kelola laporan kendala data, permohonan SK, dan bantuan pengurus se-Sulawesi Utara
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => fetchThreads()}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer touch-manipulation"
              title="Perbarui daftar percakapan"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingThreads ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer touch-manipulation"
              title="Tutup jendela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Split: Threads List & Active Conversation */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Kolom Kiri: Daftar Thread Pengurus (Disembunyikan di HP jika sedang buka percakapan) */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-950/50 ${
              isMobileDetailOpen ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Bar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pengurus atau wilayah..."
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#1A3282] touch-manipulation"
                />
              </div>
            </div>

            {/* List Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {searchQuery ? 'Tidak ada percakapan yang cocok.' : 'Belum ada pesan masuk dari pengurus.'}
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = selectedThread?.threadId === t.threadId;
                  const isDirectedToMe =
                    t.recipientNik &&
                    (t.recipientNik === session.adminNik ||
                      t.recipientNik === session.adminName ||
                      (session.adminNik && t.recipientNik.includes(session.adminNik)));

                  return (
                    <button
                      key={t.threadId}
                      onClick={() => {
                        setSelectedThread(t);
                        setIsMobileDetailOpen(true);
                      }}
                      className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 touch-manipulation ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-l-[#1A3282] dark:border-l-blue-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#1A3282] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {t.pengurusName.charAt(0) || 'P'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {t.pengurusName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatThreadTime(t.lastMessageTime)}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#1A3282] dark:text-blue-300 font-semibold truncate mt-0.5">
                          {t.pengurusJabatan || t.pengurusRole} · {t.pengurusDpd}
                        </div>

                        {/* Indikator Tujuan Pesan (Hybrid Model Badge) */}
                        <div className="mt-1 flex items-center gap-1">
                          {t.recipientNik && t.recipientNik !== 'ALL_DPW' ? (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                                isDirectedToMe
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-[#9E6706] dark:text-amber-300 border border-amber-300/60 shadow-2xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60'
                              }`}
                            >
                              {isDirectedToMe ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>🎯 Khusus Anda</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[130px]">
                                    {t.recipientName || 'Admin Tertentu'}
                                  </span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1A3282] dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 inline-flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5 text-[#1A3282] dark:text-blue-400 shrink-0" />
                              <span>Tim DPW Standby</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                          {t.lastMessage}
                        </p>
                      </div>

                      {t.unreadCount > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs animate-bounce">
                          {t.unreadCount}
                        </span>
                      ) : (
                        <span
                          className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0 flex items-center gap-0.5"
                          title="Sudah terbaca"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Percakapan Aktif (Full screen di HP jika sedang buka percakapan) */}
          <div
            className={`flex-1 flex flex-col bg-white dark:bg-slate-900 min-h-0 ${
              !isMobileDetailOpen ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedThread ? (
              <>
                {/* Header Percakapan Terpilih */}
                <div className="p-3 sm:p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Tombol kembali khusus tampilan HP */}
                    <button
                      type="button"
                      onClick={() => setIsMobileDetailOpen(false)}
                      className="md:hidden p-1.5 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
                      title="Kembali ke daftar pengurus"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1A3282] to-[#21409A] text-white font-bold flex items-center justify-center shadow-xs shrink-0">
                      {selectedThread.pengurusName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{selectedThread.pengurusName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-900/50 shrink-0">
                          {selectedThread.pengurusJabatan || selectedThread.pengurusRole}
                        </span>
                      </h4>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">
                          {selectedThread.pengurusDpd}
                          {selectedThread.pengurusDpc ? ` › ${selectedThread.pengurusDpc}` : ''}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="truncate text-amber-700 dark:text-amber-400 font-semibold text-[10px]">
                          {selectedThread.recipientNik && selectedThread.recipientNik !== 'ALL_DPW'
                            ? `Tujuan: ${selectedThread.recipientName || 'Admin Khusus'}`
                            : 'Tujuan: Tim DPW Standby'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* List Pesan */}
                <div className="flex-1 p-4 overflow-y-auto space-y-1 bg-slate-50/30 dark:bg-slate-950/20">
                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Memuat percakapan...
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <ChatMessageBubble
                        key={msg.id}
                        message={msg}
                        isMyMessage={msg.senderRole === 'SUPER_ADMIN'}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Indikator Pengurus Sedang Mengetik */}
                {isPengurusTyping && (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-[#1A3282] dark:text-blue-300 font-medium animate-in fade-in duration-150">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A3282] dark:bg-blue-400 animate-bounce [animation-delay:0s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A3282] dark:bg-blue-400 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A3282] dark:bg-blue-400 animate-bounce [animation-delay:0.3s]" />
                    </div>
                    <span>{selectedThread.pengurusName} sedang mengetik...</span>
                  </div>
                )}

                {/* Input Balasan Super Admin */}
                <ChatInputBox
                  onSendMessage={handleSendMessage}
                  onTyping={() =>
                    selectedThread &&
                    supportChatService.sendTyping(selectedThread.threadId, session.adminName, 'SUPER_ADMIN')
                  }
                  placeholder={`Balas ${selectedThread.pengurusName} sebagai Super Admin...`}
                  showCategoryPicker={false}
                />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Pilih Percakapan
                </h4>
                <p className="text-xs max-w-xs mt-1">
                  Pilih salah satu pengurus dari daftar di samping untuk melihat riwayat laporan dan membalasnya.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

