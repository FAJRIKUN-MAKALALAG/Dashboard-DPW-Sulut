import React from 'react';
import { Users, Search } from 'lucide-react';
import { Member } from '../../types';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';

interface PengurusRecruitsListProps {
  filteredRecruits: Member[];
  myRecruitsCount: number;
  myReferralCode: string;
  searchRecruit: string;
  setSearchRecruit: (query: string) => void;
}

export const PengurusRecruitsList: React.FC<PengurusRecruitsListProps> = ({
  filteredRecruits,
  myRecruitsCount,
  myReferralCode,
  searchRecruit,
  setSearchRecruit,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Daftar Kader Hasil Rekrutmen Anda ({myRecruitsCount} Anggota)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Kader resmi Partai NasDem yang terdaftar melalui kode referral Anda ({myReferralCode}).
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
          <input
            type="text"
            value={searchRecruit}
            onChange={(e) => setSearchRecruit(e.target.value)}
            placeholder="Cari nama / NIK..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {filteredRecruits.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Belum Ada Anggota yang Terdaftar Melalui Kode Ini
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Gunakan formulir di atas untuk mendaftarkan kader baru atau bagikan kode referral Anda ({myReferralCode}) ke calon kader.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Nama Kader</th>
                <th className="p-3">NIK &amp; E-KTA</th>
                <th className="p-3">Wilayah Domisili</th>
                <th className="p-3">WhatsApp / HP</th>
                <th className="p-3">Tanggal Daftar</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecruits.map((m) => (
                <tr key={m.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-10 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                        {m.fotoProfilUrl ? (
                          <img
                            src={resolveImageUrl(m.fotoProfilUrl)}
                            alt={m.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center text-[10px] font-bold font-mono ${getAvatarColor(m.namaLengkap).bgClass} ${getAvatarColor(m.namaLengkap).textClass}`}
                          >
                            {getInitials(m.namaLengkap)}
                          </div>
                        )}
                      </div>
                      <span className="truncate">{m.namaLengkap}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                    <div>{m.nik}</div>
                    <div className="text-[10px] text-slate-500">{m.nomorEKTA || '-'}</div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{m.dpd}</div>
                    <div className="text-[10px] text-slate-400">{m.dpc} • {m.dprt}</div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {m.nomorHP || '-'}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {m.tanggalBergabung}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
