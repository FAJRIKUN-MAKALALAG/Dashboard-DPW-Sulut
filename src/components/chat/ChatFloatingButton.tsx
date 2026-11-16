import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { useDraggableBubble } from './useDraggableBubble';

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
  const {
    containerRef,
    position,
    isDragging,
    handlePointerDown,
    handleClickCapture,
  } = useDraggableBubble();

  if (isOpen) return null;

  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onClickCapture={handleClickCapture}
      style={{
        right: `${position.right}px`,
        bottom: `${position.bottom}px`,
        transform: 'translate3d(0px, 0px, 0px)',
      }}
      className={`fixed z-[9999] touch-none select-none will-change-transform ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`relative group w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#1A3282] to-[#21409A] hover:from-[#152868] hover:to-[#1A3282] text-white shadow-[0_8px_24px_-4px_rgba(26,50,130,0.65)] border-2 border-[#FDB813] flex items-center justify-center transition-transform duration-150 ${
          isDragging
            ? 'cursor-grabbing scale-110 ring-4 ring-amber-400/40 shadow-2xl'
            : 'cursor-pointer hover:scale-105 active:scale-95'
        }`}
        title={
          isSuperAdmin
            ? 'Inbox Pesan Pengurus (Tahan & geser untuk memindahkan)'
            : 'Chat Admin DPW (Tahan & geser untuk memindahkan)'
        }
        aria-label={isSuperAdmin ? 'Inbox Pesan Pengurus' : 'Chat Admin DPW'}
      >
        {/* Pulsing indicator ring */}
        {!isDragging && (
          <span className="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping pointer-events-none" />
        )}

        {/* Chat Icon Only */}
        <MessageSquareText className="w-6 h-6 text-[#FFDD00] pointer-events-none" />

        {/* Status dot online */}
        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#1A3282] pointer-events-none" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-white shadow-md animate-bounce pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
