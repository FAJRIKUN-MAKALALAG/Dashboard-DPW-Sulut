import React, { useMemo, useState } from 'react';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../../utils/imageUtils';

export const MatrixMemberAvatar: React.FC<{
  fotoProfilUrl?: string;
  namaLengkap: string;
  sizeCls?: string;
  initialsCls?: string;
}> = ({ fotoProfilUrl, namaLengkap, sizeCls = 'w-6 h-7', initialsCls = 'text-[8px]' }) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = useMemo(() => resolveImageUrl(fotoProfilUrl), [fotoProfilUrl]);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`${sizeCls} rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 font-bold font-mono ${getAvatarColor(namaLengkap).bgClass} ${getAvatarColor(namaLengkap).textClass} ${initialsCls}`}
      >
        {getInitials(namaLengkap)}
      </div>
    );
  }

  return (
    <div className={`${sizeCls} rounded overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`}>
      <img
        src={resolvedSrc}
        alt={namaLengkap}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

