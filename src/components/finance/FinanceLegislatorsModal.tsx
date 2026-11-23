import React, { useEffect, useState } from 'react';
import { History, Loader2, Plus, Settings2, X, Zap } from 'lucide-react';
import { FinanceService } from '../../services';
import { FinanceLegislator, FinanceTariffRule } from '../../types/finance';
import { formatMonthLabel, formatRupiah, getCurrentYearMonth } from './financeHelpers';

interface FinanceLegislatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  legislators: FinanceLegislator[];
  daerahList: string[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const FinanceLegislatorsModal: React.FC<FinanceLegislatorsModalProps> = ({
  isOpen,
  onClose,
  legislators,
  daerahList,
  onRefresh,
  showToast,
}) => {
  const [tab, setTab] = useState<'legislators' | 'tariffs'>('legislators');
  const [tariffs, setTariffs] = useState<FinanceTariffRule[]>([]);
  const [loadingTariffs, setLoadingTariffs] = useState(false);

  // Add legislator form
  const [newName, setNewName] = useState('');
  const [newTingkat, setNewTingkat] = useState<'PROVINSI' | 'KAB_KOTA'>('KAB_KOTA');
  const [newDaerah, setNewDaerah] = useState(daerahList[0] || 'Kota Manado');
  const [newAuto, setNewAuto] = useState(false);
  const [newStartMonth, setNewStartMonth] = useState(getCurrentYearMonth());
  const [savingLeg, setSavingLeg] = useState(false);

  // Edit Autodebet inline modal state
  const [editingAutoLeg, setEditingAutoLeg] = useState<FinanceLegislator | null>(null);
  const [editAutoActive, setEditAutoActive] = useState(true);
  const [editAutoStart, setEditAutoStart] = useState(getCurrentYearMonth());
  const [editAutoEnd, setEditAutoEnd] = useState('');
  const [editAutoNotes, setEditAutoNotes] = useState('');

  // Add tariff rule form
  const [trfTingkat, setTrfTingkat] = useState<'PROVINSI' | 'KAB_KOTA'>('KAB_KOTA');
  const [trfDaerah, setTrfDaerah] = useState(daerahList[0] || 'Kota Manado');
  const [trfFrom, setTrfFrom] = useState(getCurrentYearMonth());
  const [trfDpw, setTrfDpw] = useState('1000000');
  const [trfDpp, setTrfDpp] = useState('2200000');
  const [trfNotes, setTrfNotes] = useState('');

  const loadTariffs = async () => {
    setLoadingTariffs(true);
    try {
      setTariffs(await FinanceService.listTariffs());
    } finally {
      setLoadingTariffs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTariffs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateLegislator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDaerah.trim()) return;
    setSavingLeg(true);
    try {
      await FinanceService.createLegislator({
        namaLengkap: newName.trim(),
        tingkat: newTingkat,
        daerah: newDaerah.trim(),
        isAutodebetActive: newAuto,
        autodebetStartMonth: newAuto ? newStartMonth : undefined,
      });
      showToast(`Anggota fraksi ${newName.trim()} ditambahkan`);
      setNewName('');
      await onRefresh();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menambah anggota fraksi'}`);
    } finally {
      setSavingLeg(false);
    }
  };

  const openEditAutodebet = (leg: FinanceLegislator) => {
    setEditingAutoLeg(leg);
    setEditAutoActive(!leg.isAutodebetActive);
    setEditAutoStart(leg.autodebetStartMonth || getCurrentYearMonth());
    setEditAutoEnd(getCurrentYearMonth());
    setEditAutoNotes('');
  };

  const handleSaveAutodebetTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAutoLeg) return;
    try {
      await FinanceService.updateLegislator(editingAutoLeg.id, {
        isAutodebetActive: editAutoActive,
        autodebetStartMonth: editAutoStart,
        autodebetEndMonth: editAutoActive ? null : editAutoEnd,
        autodebetNotes:
          editAutoNotes ||
          (editAutoActive
            ? `Autodebet diaktifkan mulai ${editAutoStart}`
            : `Autodebet dihentikan pada ${editAutoEnd}`),
      });
      showToast(`Status autodebet ${editingAutoLeg.namaLengkap} diperbarui`);
      setEditingAutoLeg(null);
      await onRefresh();
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal memperbarui status autodebet'}`);
    }
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await FinanceService.createTariff({
        tingkat: trfTingkat,
        daerah: trfDaerah,
        effectiveFrom: trfFrom,
        amountDpw: Number(trfDpw || 0),
        amountDpp: Number(trfDpp || 0),
        notes: trfNotes,
      });
      showToast(`Aturan tarif ${trfDaerah} mulai ${trfFrom} disimpan`);
      setTrfNotes('');
      await Promise.all([loadTariffs(), onRefresh()]);
    } catch (err: any) {
      showToast(`⚠️ ${err?.message || 'Gagal menambah tarif'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-[#002B49] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                Master Fraksi, Riwayat Autodebet &amp; Tarif Per Daerah
              </h3>
              <p className="text-[11px] text-slate-300">
                Catat kapan anggota mulai atau berhenti Autodebet, tambah anggota dewan (PAW), serta sesuaikan tarif DPW &amp; DPP tiap daerah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setTab('legislators')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              tab === 'legislators'
                ? 'bg-[#1A3282] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            Anggota Fraksi &amp; Riwayat Autodebet ({legislators.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('tariffs')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${
              tab === 'tariffs'
                ? 'bg-[#1A3282] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            Master Tarif Per Daerah ({tariffs.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {tab === 'legislators' ? (
            <>
              {/* Add Legislator Form */}
              <form
                onSubmit={handleCreateLegislator}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nama Lengkap Anggota Dewan Baru
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama anggota dewan / PAW..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Daerah
                  </label>
                  <select
                    value={newDaerah}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDaerah(val);
                      setNewTingkat(val.includes('Provinsi') ? 'PROVINSI' : 'KAB_KOTA');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                  >
                    {daerahList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAuto}
                      onChange={(e) => setNewAuto(e.target.checked)}
                    />
                    <span>Autodebet Mulai</span>
                  </label>
                  <input
                    type="month"
                    disabled={!newAuto}
                    value={newStartMonth}
                    onChange={(e) => setNewStartMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingLeg || !newName.trim()}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingLeg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Tambah Fraksi</span>
                </button>
              </form>

              {/* Inline Transition Form for Autodebet Start / Stop */}
              {editingAutoLeg && (
                <form
                  onSubmit={handleSaveAutodebetTransition}
                  className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Ubah Status Autodebet: {editingAutoLeg.namaLengkap} ({editingAutoLeg.daerah})
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingAutoLeg(null)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10.5px] font-bold mb-1">Status Baru</label>
                      <select
                        value={editAutoActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) => setEditAutoActive(e.target.value === 'ACTIVE')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        <option value="ACTIVE">AKTIF AUTODEBET</option>
                        <option value="INACTIVE">BERHENTI AUTODEBET (Manual)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold mb-1">Bulan Mulai Autodebet</label>
                      <input
                        type="month"
                        value={editAutoStart}
                        onChange={(e) => setEditAutoStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    {!editAutoActive && (
                      <div>
                        <label className="block text-[10.5px] font-bold mb-1">Bulan Terakhir Autodebet</label>
                        <input
                          type="month"
                          value={editAutoEnd}
                          onChange={(e) => setEditAutoEnd(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[10.5px] font-bold mb-1">Catatan</label>
                      <input
                        type="text"
                        value={editAutoNotes}
                        onChange={(e) => setEditAutoNotes(e.target.value)}
                        placeholder="Alasan perubahan..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1A3282] text-white font-bold cursor-pointer"
                  >
                    Simpan Riwayat &amp; Status Autodebet
                  </button>
                </form>
              )}

              {/* Legislators List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {legislators.map((leg) => (
                  <div
                    key={leg.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {leg.namaLengkap}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {leg.daerah}
                        </span>
                        <span className="font-mono text-[10.5px] text-slate-500">
                          DPW {formatRupiah(leg.currentTariffDpw)} + DPP {formatRupiah(leg.currentTariffDpp)}
                        </span>
                      </div>

                      {leg.autodebetHistories && leg.autodebetHistories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500">
                          <History className="w-3 h-3 text-blue-500" />
                          {leg.autodebetHistories.map((h) => (
                            <span
                              key={h.id}
                              className={`px-2 py-0.5 rounded border ${
                                h.isActive
                                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {formatMonthLabel(h.startMonth)} &rarr;{' '}
                              {h.endMonth ? formatMonthLabel(h.endMonth) : 'Sekarang (Aktif)'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditAutodebet(leg)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                        leg.isAutodebetActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>
                        {leg.isAutodebetActive ? 'Autodebet Aktif (Ubah)' : 'Atur Autodebet'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Add Tariff Form */}
              <form
                onSubmit={handleCreateTariff}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[10.5px] font-bold mb-1">Daerah</label>
                  <select
                    value={trfDaerah}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTrfDaerah(val);
                      setTrfTingkat(val.includes('Provinsi') ? 'PROVINSI' : 'KAB_KOTA');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {daerahList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold mb-1">Berlaku Mulai</label>
                  <input
                    type="month"
                    value={trfFrom}
                    onChange={(e) => setTrfFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold mb-1">Tarif DPW (Rp)</label>
                  <input
                    type="number"
                    value={trfDpw}
                    onChange={(e) => setTrfDpw(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold mb-1">Tarif DPP (Rp)</label>
                  <input
                    type="number"
                    value={trfDpp}
                    onChange={(e) => setTrfDpp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Tarif</span>
                </button>
              </form>

              {loadingTariffs ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Daerah</th>
                        <th className="py-2.5 px-3">Berlaku Periode</th>
                        <th className="py-2.5 px-3 text-right">Iuran DPW</th>
                        <th className="py-2.5 px-3 text-right">Iuran DPP</th>
                        <th className="py-2.5 px-3 text-right">Total / Bln</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tariffs.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2 px-3 font-semibold">{t.daerah}</td>
                          <td className="py-2 px-3 font-mono text-[11px]">
                            {formatMonthLabel(t.effectiveFrom)} &rarr;{' '}
                            {t.effectiveTo ? formatMonthLabel(t.effectiveTo) : 'Sekarang'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                            {formatRupiah(t.amountDpw)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-blue-700 dark:text-blue-400">
                            {formatRupiah(t.amountDpp)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {formatRupiah(t.totalObligation)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
