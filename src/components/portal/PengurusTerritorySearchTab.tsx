import React from 'react';
import { Search, Users } from 'lucide-react';
import { Member } from '../../types';
import { getInitials, getAvatarColor, resolveImageUrl } from '../../utils/imageUtils';

interface PengurusTerritorySearchTabProps {
  searchTerritoryTitle: string;
  filterMembershipType: 'ALL' | 'PENGURUS' | 'ANGGOTA';
  setFilterMembershipType: (type: 'ALL' | 'PENGURUS' | 'ANGGOTA') => void;
  territoryMembersCount: number;
  pengurusCount: number;
  anggotaCount: number;
  searchMemberQuery: string;
  setSearchMemberQuery: (query: string) => void;
  filteredTerritoryMembers: Member[];
}

export const PengurusTerritorySearchTab: React.FC<PengurusTerritorySearchTabProps> = ({
  searchTerritoryTitle,
  filterMembershipType,
  setFilterMembershipType,
  territoryMembersCount,
  pengurusCount,
  anggotaCount,
  searchMemberQuery,
  setSearchMemberQuery,
  filteredTerritoryMembers,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>{searchTerritoryTitle}</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Pencarian data anggota dan pengurus dengan hak akses teritorial wilayah Anda.
          </p>
        </div>

        {/* Filter Jenis: Semua / Pengurus / Anggota Biasa */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterMembershipType('ALL')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterMembershipType === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semua ({territoryMembersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMembershipType('PENGURUS')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterMembershipType === 'PENGURUS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pengurus ({pengurusCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMembershipType('ANGGOTA')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterMembershipType === 'ANGGOTA'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Anggota ({anggotaCount})
          </button>
        </div>
      </div>

      {/* Kolom Pencarian Cepat */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchMemberQuery}
          onChange={(e) => setSearchMemberQuery(e.target.value)}
          placeholder="Cari berdasarkan nama lengkap, NIK, e-KTA, jabatan, nomor HP, kecamatan atau kelurahan..."
          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Tabel Hasil Pencarian */}
      {filteredTerritoryMembers.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Tidak Ada Data yang Cocok dengan Kata Kunci
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Silakan coba ubah kata kunci pencarian nama, NIK, atau jenis keanggotaan.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">NIK &amp; E-KTA</th>
                <th className="p-3">Jabatan &amp; Peran</th>
                <th className="p-3">Wilayah Teritorial</th>
                <th className="p-3">WhatsApp / HP</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTerritoryMembers.slice(0, 100).map((m) => (
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
                      <div className="min-w-0">
                        <div className="truncate">{m.namaLengkap}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Gabung: {m.tanggalBergabung || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                    <div>{m.nik}</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400">{m.nomorEKTA || '-'}</div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      m.isPengurus
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {m.jabatan || 'Anggota Biasa'}
                    </span>
                    {m.tingkatKepengurusan && m.tingkatKepengurusan !== 'Bukan Pengurus' && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tingkat {m.tingkatKepengurusan}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{m.dpd}</div>
                    <div className="text-[10px] text-slate-400">
                      {m.dpc ? `Kec. ${m.dpc}` : '-'} &middot; {m.dprt ? `Desa ${m.dprt}` : '-'}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                    {m.nomorHP || '-'}
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

          {filteredTerritoryMembers.length > 100 && (
            <div className="p-2.5 text-center text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
              Menampilkan 100 dari {filteredTerritoryMembers.length} anggota. Gunakan kolom pencarian di atas untuk menyaring nama tertentu.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
