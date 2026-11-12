import React from 'react';
import { Check, CheckCheck, Shield, User, Paperclip } from 'lucide-react';
import { SupportMessage } from './types';

interface ChatMessageBubbleProps {
  message: SupportMessage;
  isMyMessage: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isMyMessage }) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'NIK_DATA':
        return { label: 'Data NIK', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' };
      case 'SK_KEPENGURUSAN':
        return { label: 'SK Pengurus', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300' };
      case 'EKTA_DPP':
        return { label: 'e-KTA DPP', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' };
      case 'KENDALA_SISTEM':
        return { label: 'Kendala Sistem', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' };
      default:
        return null;
    }
  };

  const catBadge = message.category ? getCategoryBadge(message.category) : null;

  return (
    <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} my-2.5 animate-in fade-in duration-150`}>
      {/* Pengirim info */}
      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">
        {!isMyMessage && (
          <>
            {message.senderRole === 'SUPER_ADMIN' ? (
              <span className="flex items-center gap-1 font-bold text-[#1A3282] dark:text-amber-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/60 shadow-2xs">
                <Shield className="w-3 h-3 text-[#FDB813]" /> Admin DPW · {message.senderName}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700">
                <User className="w-3 h-3 text-[#1A3282] dark:text-blue-400" />
                <span>{message.senderName}</span>
                {message.senderJabatan && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    · {message.senderJabatan}
                  </span>
                )}
              </span>
            )}
          </>
        )}
      </div>

      {/* Bubble utama */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed transition-all ${
          isMyMessage
            ? 'bg-gradient-to-br from-[#1A3282] via-[#21409A] to-[#1A3282] text-white rounded-tr-xs shadow-md border border-blue-900/40'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs shadow-xs'
        }`}
      >
        {/* Badge Tujuan Personal Khusus */}
        {isMyMessage && message.recipientNik && message.recipientNik !== 'ALL_DPW' && (
          <div className="mb-1">
            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-[#FFDD00] border border-[#FFDD00]/30 shadow-2xs">
              🎯 Ditujukan ke: {message.recipientName || 'Super Admin Khusus'}
            </span>
          </div>
        )}

        {catBadge && (
          <div className="mb-1.5">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${catBadge.bg}`}>
              {catBadge.label}
            </span>
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">{message.message}</div>

        {message.attachmentUrl && (
          <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700">
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] underline opacity-90 hover:opacity-100"
            >
              <Paperclip className="w-3 h-3" />
              <span>Lihat Lampiran</span>
            </a>
          </div>
        )}

        {/* Timestamp & Status Baca (Indikator Kecil Jelas) */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1.5 pt-0.5 text-[10px] ${
            isMyMessage ? 'text-blue-200/90' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isMyMessage && (
            <span
              className="inline-flex items-center"
              title={message.isRead ? 'Pesan telah dibaca oleh lawan bicara' : 'Pesan terkirim'}
            >
              {message.isRead ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-400/20 text-[#FFDD00] font-bold text-[9px] border border-[#FFDD00]/40 shadow-2xs">
                  <CheckCheck className="w-3 h-3 text-[#FFDD00]" />
                  <span>Dibaca</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-blue-200/80 text-[9px]">
                  <Check className="w-3 h-3 opacity-80" />
                  <span>Terkirim</span>
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

