import React, { useState } from 'react';
import { resolveInventoryPhotoUrl } from './inventoryService';

interface InventoryProductGraphicProps {
  namaBarang: string;
  kategori: string;
  fotoUrl?: string;
  className?: string;
}

type VisualType =
  | 'desk'
  | 'conference_table'
  | 'chair'
  | 'sofa'
  | 'cabinet'
  | 'computer'
  | 'ac'
  | 'printer'
  | 'tv'
  | 'sound'
  | 'podium'
  | 'rack'
  | 'flag'
  | 'camera'
  | 'box';

function detectVisualType(nama: string, kategori: string): VisualType {
  const n = (nama || '').toLowerCase();
  const k = (kategori || '').toLowerCase();

  if (n.includes('konferensi') || n.includes('rapat oval') || n.includes('meja lipat')) {
    return 'conference_table';
  }
  if (n.includes('meja')) return 'desk';
  if (n.includes('sofa')) return 'sofa';
  if (n.includes('kursi')) return 'chair';
  if (n.includes('lemari') || n.includes('arsip') || n.includes('kabinet')) return 'cabinet';
  if (n.includes('rak')) return 'rack';
  if (n.includes('komputer') || n.includes('pc') || n.includes('laptop') || n.includes('workstation')) {
    return 'computer';
  }
  if (n.includes('ac ') || n.startsWith('ac') || n.includes('pendingin')) return 'ac';
  if (n.includes('printer') || n.includes('fotokopi') || n.includes('scanner')) return 'printer';
  if (n.includes('tv') || n.includes('monitor') || n.includes('layar') || n.includes('proyektor')) {
    return 'tv';
  }
  if (n.includes('sound') || n.includes('speaker') || n.includes('mic') || n.includes('audio')) {
    return 'sound';
  }
  if (n.includes('podium') || n.includes('mimbar')) return 'podium';
  if (n.includes('bendera') || n.includes('pataka') || n.includes('spanduk') || n.includes('umbul')) {
    return 'flag';
  }
  if (n.includes('kamera') || n.includes('lighting') || n.includes('podcast')) return 'camera';

  if (k.includes('furnitur') || k.includes('mebel')) return 'desk';
  if (k.includes('elektronik')) return 'computer';
  if (k.includes('audio')) return 'sound';
  return 'box';
}

export const InventoryProductGraphic: React.FC<InventoryProductGraphicProps> = ({
  namaBarang,
  kategori,
  fotoUrl,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveInventoryPhotoUrl(fotoUrl);

  if (resolvedUrl && !imgError) {
    return (
      <img
        src={resolvedUrl}
        alt={namaBarang}
        onError={() => setImgError(true)}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${className}`}
        loading="lazy"
      />
    );
  }

  const visual = detectVisualType(namaBarang, kategori);

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-slate-50/90 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 select-none relative overflow-hidden ${className}`}
    >
      {/* Subtle architectural grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Studio Minimalist Vector Illustration */}
      <div className="relative z-10 w-[100%] h-[100%] transition-transform duration-300 group-hover:scale-105 flex flex-col items-center justify-center">
        {visual === 'desk' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            {/* Monitor on desk */}
            <rect x="44" y="14" width="32" height="20" rx="2" className="fill-slate-200/80 dark:fill-slate-700/80 stroke-current" strokeWidth="2" />
            <path d="M56 34V40M64 34V40M50 40H70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Desk surface */}
            <rect x="14" y="40" width="92" height="6" rx="1.5" className="fill-slate-300 dark:fill-slate-600 stroke-current" strokeWidth="2" />
            {/* Left leg */}
            <path d="M20 46V76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* Right drawer pedestal */}
            <rect x="74" y="46" width="26" height="28" rx="1" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2" />
            <line x1="74" y1="55" x2="100" y2="55" stroke="currentColor" strokeWidth="1.5" />
            <line x1="74" y1="64" x2="100" y2="64" stroke="currentColor" strokeWidth="1.5" />
            <line x1="84" y1="50.5" x2="90" y2="50.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="84" y1="59.5" x2="90" y2="59.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="84" y1="69" x2="90" y2="69" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            {/* Modesty panel */}
            <rect x="24" y="46" width="46" height="14" className="fill-slate-100 dark:fill-slate-700/50 stroke-current" strokeWidth="1.5" />
          </svg>
        )}

        {visual === 'conference_table' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            {/* Back chairs */}
            <path d="M28 32V25C28 23 30 22 33 22H39C42 22 44 23 44 25V32" stroke="currentColor" strokeWidth="1.8" />
            <path d="M52 30V23C52 21 54 20 57 20H63C66 20 68 21 68 23V30" stroke="currentColor" strokeWidth="1.8" />
            <path d="M76 32V25C76 23 78 22 81 22H87C90 22 92 23 92 25V32" stroke="currentColor" strokeWidth="1.8" />
            {/* Oval conference tabletop */}
            <ellipse cx="60" cy="44" rx="48" ry="13" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <ellipse cx="60" cy="44" rx="22" ry="4" className="fill-slate-200/70 dark:fill-slate-700 stroke-current" strokeWidth="1.3" />
            {/* Pedestal legs */}
            <path d="M36 55V72M84 55V72M30 72H42M78 72H90" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}

        {visual === 'chair' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            {/* Backrest */}
            <rect x="44" y="12" width="32" height="32" rx="6" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <line x1="50" y1="22" x2="70" y2="22" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
            <line x1="50" y1="30" x2="70" y2="30" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
            {/* Armrests */}
            <path d="M44 34H37V48H44M76 34H83V48H76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Seat */}
            <rect x="40" y="46" width="40" height="7" rx="3" className="fill-slate-300 dark:fill-slate-600 stroke-current" strokeWidth="2" />
            {/* Hydraulic & wheels */}
            <path d="M60 53V68M60 68L44 74M60 68L76 74M60 68V75" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="44" cy="76" r="2" fill="currentColor" />
            <circle cx="60" cy="77" r="2" fill="currentColor" />
            <circle cx="76" cy="76" r="2" fill="currentColor" />
          </svg>
        )}

        {visual === 'sofa' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <rect x="20" y="24" width="80" height="28" rx="5" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2" />
            <line x1="47" y1="24" x2="47" y2="52" stroke="currentColor" strokeWidth="1.5" />
            <line x1="73" y1="24" x2="73" y2="52" stroke="currentColor" strokeWidth="1.5" />
            {/* Armrests */}
            <rect x="12" y="34" width="12" height="26" rx="4" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="2" />
            <rect x="96" y="34" width="12" height="26" rx="4" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="2" />
            {/* Seat base */}
            <rect x="24" y="46" width="72" height="14" rx="2" className="fill-slate-100 dark:fill-slate-700/80 stroke-current" strokeWidth="2" />
            <path d="M22 60V68M98 60V68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}

        {visual === 'cabinet' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <rect x="34" y="12" width="52" height="66" rx="2" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <line x1="60" y1="12" x2="60" y2="78" stroke="currentColor" strokeWidth="1.8" />
            <line x1="34" y1="34" x2="86" y2="34" stroke="currentColor" strokeWidth="1.4" />
            <line x1="34" y1="56" x2="86" y2="56" stroke="currentColor" strokeWidth="1.4" />
            <line x1="55" y1="42" x2="55" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="65" y1="42" x2="65" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}

        {visual === 'rack' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <path d="M30 12V78M90 12V78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="20" x2="90" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="38" x2="90" y2="38" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="56" x2="90" y2="56" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="74" x2="90" y2="74" stroke="currentColor" strokeWidth="2" />
            <rect x="38" y="25" width="18" height="13" rx="1" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="1.5" />
            <rect x="62" y="25" width="20" height="13" rx="1" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="1.5" />
            <rect x="38" y="43" width="24" height="13" rx="1" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="1.5" />
            <rect x="66" y="43" width="16" height="13" rx="1" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="1.5" />
          </svg>
        )}

        {visual === 'computer' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <rect x="26" y="16" width="68" height="42" rx="3" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <rect x="31" y="21" width="58" height="30" rx="1" className="fill-slate-100 dark:fill-slate-700/60 stroke-current" strokeWidth="1.2" />
            <path d="M54 58L50 68H70L66 58" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="2" strokeLinejoin="round" />
            <rect x="36" y="72" width="48" height="5" rx="1.5" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="1.6" />
          </svg>
        )}

        {visual === 'ac' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <rect x="18" y="24" width="84" height="26" rx="5" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <line x1="24" y1="43" x2="96" y2="43" stroke="currentColor" strokeWidth="1.8" />
            <rect x="82" y="30" width="10" height="4" rx="1" className="fill-slate-300 dark:fill-slate-600" />
            <path d="M36 56C36 62 32 66 32 70M60 56C60 62 60 66 60 70M84 56C84 62 88 66 88 70" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3" />
          </svg>
        )}

        {visual === 'printer' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <path d="M40 28V16H80V28" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2" />
            <rect x="24" y="28" width="72" height="32" rx="4" className="fill-slate-100 dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <rect x="38" y="50" width="44" height="22" rx="1.5" className="fill-white dark:fill-slate-700 stroke-current" strokeWidth="2" />
            <line x1="45" y1="58" x2="75" y2="58" stroke="currentColor" strokeWidth="1.6" />
            <line x1="45" y1="64" x2="68" y2="64" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="84" cy="37" r="2.5" fill="currentColor" />
          </svg>
        )}

        {visual === 'tv' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <rect x="18" y="14" width="84" height="48" rx="3" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <rect x="23" y="19" width="74" height="38" rx="1" className="fill-slate-100 dark:fill-slate-700/60 stroke-current" strokeWidth="1.2" />
            <path d="M46 62V76M74 62V76M36 76H84" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}

        {visual === 'sound' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            {/* Speaker Box */}
            <rect x="28" y="14" width="40" height="62" rx="4" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <circle cx="48" cy="30" r="7" className="fill-slate-100 dark:fill-slate-700 stroke-current" strokeWidth="1.8" />
            <circle cx="48" cy="54" r="13" className="fill-slate-200/80 dark:fill-slate-700 stroke-current" strokeWidth="2" />
            <circle cx="48" cy="54" r="4" fill="currentColor" />
            {/* Wireless Mic */}
            <rect x="80" y="24" width="12" height="18" rx="6" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="2" />
            <path d="M83 42L84 68H88L89 42" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2" />
          </svg>
        )}

        {visual === 'podium' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <path d="M36 22L84 22L78 32H42L36 22Z" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="2" strokeLinejoin="round" />
            <rect x="44" y="32" width="32" height="40" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2" />
            <circle cx="60" cy="48" r="7" className="fill-slate-100 dark:fill-slate-700 stroke-current" strokeWidth="1.6" />
            <rect x="38" y="72" width="44" height="6" rx="1.5" className="fill-slate-300 dark:fill-slate-600 stroke-current" strokeWidth="2" />
          </svg>
        )}

        {visual === 'flag' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <line x1="36" y1="14" x2="36" y2="78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 18C50 14 64 22 84 18V46C64 50 50 42 36 46V18Z" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" strokeLinejoin="round" />
            <circle cx="60" cy="32" r="6" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="1.6" />
          </svg>
        )}

        {visual === 'camera' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <rect x="32" y="24" width="56" height="36" rx="5" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" />
            <path d="M48 24L52 17H68L72 24" className="fill-slate-200 dark:fill-slate-700 stroke-current" strokeWidth="2" />
            <circle cx="60" cy="42" r="11" className="fill-slate-100 dark:fill-slate-700 stroke-current" strokeWidth="2" />
            <circle cx="60" cy="42" r="4" fill="currentColor" />
            <path d="M60 60V76M60 64L44 76M60 64L76 76" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}

        {visual === 'box' && (
          <svg className="w-[58%] h-[58%] max-w-[11rem] max-h-[9rem] text-slate-600 dark:text-slate-300" viewBox="0 0 120 90" fill="none">
            <path d="M60 16L94 32V62L60 78L26 62V32L60 16Z" className="fill-white dark:fill-slate-800 stroke-current" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M26 32L60 48L94 32M60 48V78" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};
