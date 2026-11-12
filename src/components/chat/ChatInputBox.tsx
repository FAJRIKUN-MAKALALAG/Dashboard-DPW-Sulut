import React, { useState, useRef, useEffect } from 'react';
import { Send, Tag, ChevronDown, Sparkles, Shield, User } from 'lucide-react';
import { ChatCategory, AdminTargetOption } from './types';

interface ChatInputBoxProps {
  onSendMessage: (text: string, category: ChatCategory, target?: AdminTargetOption) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showCategoryPicker?: boolean;
  adminTargets?: AdminTargetOption[];
  selectedTarget?: AdminTargetOption;
  onSelectTarget?: (target: AdminTargetOption) => void;
}

const CATEGORY_OPTIONS: { id: ChatCategory; label: string; icon: string; desc: string }[] = [
  { id: 'UMUM', label: 'Umum / Lainnya', icon: '💬', desc: 'Pertanyaan atau koordinasi umum' },
  { id: 'NIK_DATA', label: 'Kendala NIK / Data', icon: '📌', desc: 'Perbaikan nomor NIK / data ganda' },
  { id: 'SK_KEPENGURUSAN', label: 'SK Kepengurusan', icon: '📜', desc: 'Permohonan / perubahan SK' },
  { id: 'EKTA_DPP', label: 'e-KTA DPP', icon: '💳', desc: 'Penerbitan kartu anggota DPP' },
  { id: 'KENDALA_SISTEM', label: 'Kendala Sistem', icon: '⚠️', desc: 'Laporan bug / error sistem' },
];

const QUICK_TEMPLATES = [
  'Mohon bantuan verifikasi NIK',
  'Mohon cek penerbitan e-KTA DPP',
  'Permohonan update SK Kepengurusan',
  'Kendala unggah foto KTP',
];

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Ketik pesan laporan atau keluhan...',
  showCategoryPicker = true,
  adminTargets = [],
  selectedTarget,
  onSelectTarget,
}) => {
  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChatCategory>('UMUM');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isTargetPickerOpen, setIsTargetPickerOpen] = useState(false);
  const lastTypingTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
        setIsTargetPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1200) {
      lastTypingTimeRef.current = now;
      onTyping?.();
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim(), selectedCategory, selectedTarget);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyTemplate = (tpl: string) => {
    setText((prev) => (prev ? `${prev} ${tpl}` : tpl));
    onTyping?.();
  };

  return (
    <div ref={containerRef} className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 relative z-20">
      {/* Target Selector & Category Selector */}
      {showCategoryPicker && (
        <div className="flex flex-wrap items-center gap-1.5 pb-0.5 relative z-30">
          {/* 1. Selector Tujuan Chat (Tim Standby vs Personel Admin DPW) */}
          {adminTargets && adminTargets.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsTargetPickerOpen((v) => !v);
                  setIsPickerOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-[#9E6706] dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer border border-amber-200/80 dark:border-amber-800/60 shadow-2xs max-w-[210px] truncate touch-manipulation"
                title="Pilih Tujuan Admin"
              >
                <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  {selectedTarget?.isDefaultTeam
                    ? 'Tim Admin DPW (Standby)'
                    : selectedTarget?.name || 'Tujuan Admin'}
                </span>
                <ChevronDown className="w-3 h-3 text-amber-700/60 shrink-0" />
              </button>

              {isTargetPickerOpen && (
                <div className="absolute bottom-full mb-2 left-0 z-50 w-72 max-w-[92vw] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                  <div className="text-[10px] font-bold px-2 py-1 text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-1 mb-1">
                    <span>Pilih Tujuan Pesan</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">DPW SULUT</span>
                  </div>

                  {adminTargets.map((adm) => {
                    const isSelected = selectedTarget?.id === adm.id;
                    return (
                      <button
                        key={adm.id}
                        type="button"
                        onClick={() => {
                          onSelectTarget?.(adm);
                          setIsTargetPickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-start gap-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#1A3282] text-white shadow-xs ring-1 ring-[#FDB813]/60'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                        }`}
                      >
                        <span className="text-sm mt-0.5 shrink-0">
                          {adm.isDefaultTeam ? '🏢' : '🛡️'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="leading-tight font-bold truncate flex items-center gap-1.5">
                            <span className="truncate">{adm.name}</span>
                            {adm.isDefaultTeam && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black shrink-0">
                                CEPAT
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] leading-tight truncate mt-0.5 ${
                              isSelected ? 'text-blue-200' : 'text-slate-400 dark:text-slate-400'
                            }`}
                          >
                            {adm.jabatan || adm.role}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Selector Kategori Laporan */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsPickerOpen((v) => !v);
                setIsTargetPickerOpen(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#1A3282] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer border border-blue-200/70 dark:border-blue-800/60 shadow-2xs shrink-0 touch-manipulation"
            >
              <Tag className="w-3 h-3 text-[#1A3282] dark:text-amber-400 shrink-0" />
              <span>{CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isPickerOpen && (
              <div className="absolute bottom-full mb-2 left-0 z-50 w-64 max-w-[92vw] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold px-2 py-1 text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 dark:border-slate-700/50 pb-1 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Pilih Topik Laporan</span>
                </div>
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setIsPickerOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 cursor-pointer transition-colors ${
                      selectedCategory === c.id
                        ? 'bg-[#1A3282] text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span className="text-sm mt-0.5">{c.icon}</span>
                    <div className="min-w-0">
                      <div className="leading-tight font-bold">{c.label}</div>
                      <div
                        className={`text-[10px] leading-tight truncate mt-0.5 ${
                          selectedCategory === c.id ? 'text-blue-200' : 'text-slate-400 dark:text-slate-400'
                        }`}
                      >
                        {c.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick template chips */}
          <div className="hidden sm:flex items-center gap-1 shrink-0 text-[10px]">
            {QUICK_TEMPLATES.slice(0, 2).map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[190px] cursor-pointer transition-colors touch-manipulation"
                title={tpl}
              >
                + {tpl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input textarea & send button: Optimized for mobile touch */}
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <textarea
          rows={1}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 max-h-28 min-h-[42px] p-2.5 text-base sm:text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3282]/25 focus:border-[#1A3282] dark:focus:border-blue-400 resize-none transition-all touch-manipulation"
        />

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-2.5 sm:p-2.5 min-w-[42px] min-h-[42px] rounded-xl bg-gradient-to-r from-[#1A3282] to-[#21409A] hover:from-[#152868] hover:to-[#1A3282] active:scale-95 text-white disabled:opacity-40 transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0 border border-blue-900/40 touch-manipulation"
          title="Kirim Pesan (Enter)"
        >
          <Send className="w-4 h-4 text-[#FFDD00]" />
        </button>
      </form>
    </div>
  );
};

