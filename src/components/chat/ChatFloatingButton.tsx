import React from 'react';
import { MessageSquareText } from 'lucide-react';

interface ChatFloatingButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen: boolean;
  role?: string;
}

export const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({
  onClick,
  unreadCount = 0,
  isOpen,
  role,
}) => {
  if (isOpen) return null;

  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] animate-in fade-in duration-200">
      <button
        type="button"
        onClick={onClick}
        className="relative group flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-[#1A3282] to-[#21409A] hover:from-[#152868] hover:to-[#1A3282] text-white shadow-[0_10px_25px_-5px_rgba(26,50,130,0.55)] hover:shadow-2xl border-2 border-[#FDB813] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        title={isSuperAdmin ? 'Inbox Pesan Pengurus' : 'Chat Admin DPW (Bantuan & Laporan)'}
        aria-label={isSuperAdmin ? 'Inbox Pesan Pengurus' : 'Chat Admin DPW'}
      >
        {/* Pulsing indicator ring */}
        <span className="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping pointer-events-none" />

        <div className="relative flex items-center justify-center shrink-0">
          <MessageSquareText className="w-5 h-5 text-[#FFDD00]" />
          {/* Status dot online */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#1A3282]" />
        </div>

        <div className="text-left leading-tight block">
          <div className="text-xs font-black tracking-tight text-white flex items-center gap-1">
            <span>{isSuperAdmin ? 'Pesan Pengurus' : 'Chat Admin DPW'}</span>
          </div>
          <div className="text-[9px] text-amber-300 font-semibold hidden sm:block">
            {isSuperAdmin ? 'Pusat Helpdesk' : 'Bantuan & Laporan'}
          </div>
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-white shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
