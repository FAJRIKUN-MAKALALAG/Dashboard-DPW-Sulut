import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Member, UserSession, DirectLeaderInfo } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';

interface PengurusRegisterMemberFormProps {
  members: Member[];
  session: UserSession;
  activePengurusMember: Member | null;
  myReferralCode: string;
  ketuaLangsung: DirectLeaderInfo | null;
  onAddMember: (newMember: Member) => void;
  perekrutNama: string;
  perekrutJabatan: string;
  perekrutNik?: string;
}

export const PengurusRegisterMemberForm: React.FC<PengurusRegisterMemberFormProps> = ({
  members,
  session,
  activePengurusMember,
  myReferralCode,
  ketuaLangsung,
  onAddMember,
  perekrutNama,
  perekrutJabatan,
  perekrutNik,
}) => {
  const defaultDpd =
    activePengurusMember?.dpd ||
    (session.dpdAccess !== 'ALL' ? session.dpdAccess : SULUT_REGIONS[0].name);
  const defaultDpc =
    activePengurusMember?.dpc && activePengurusMember.dpc !== '-'
      ? activePengurusMember.dpc
      : '';
  const defaultDprt =
    activePengurusMember?.dprt && activePengurusMember.dprt !== '-'
      ? activePengurusMember.dprt
      : '';

  const [inputNik, setInputNik] = useState<string>('');
  const [inputEkta, setInputEkta] = useState<string>('');
  const [inputNama, setInputNama] = useState<string>('');
  const [inputHp, setInputHp] = useState<string>('');
  const [inputDpd, setInputDpd] = useState<string>(defaultDpd);
  const [inputDpc, setInputDpc] = useState<string>(defaultDpc);
  const [inputDprt, setInputDprt] = useState<string>(defaultDprt);
  const [inputAlamat, setInputAlamat] = useState<string>('');
  const [inputGender, setInputGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setInputDpd(defaultDpd);
    setInputDpc(defaultDpc);
    setInputDprt(defaultDprt);
  }, [defaultDpd, defaultDpc, defaultDprt]);

  const currentRegion = SULUT_REGIONS.find((r) => r.name === inputDpd);
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanNik = inputNik.replace(/[^0-9]/g, '').trim();
    if (cleanNik.length !== 16) {
      setFormError('Nomor NIK KTP wajib 16 digit angka.');
      return;
    }

    if (!inputNama.trim()) {
      setFormError('Nama lengkap calon kader wajib diisi.');
      return;
    }

    const isDuplicate = members.some((m) => m.nik === cleanNik);
    if (isDuplicate) {
      setFormError(`NIK ${cleanNik} sudah terdaftar sebelumnya di database.`);
      return;
    }

    setIsSubmitting(true);

    const newMember: Member = {
      nik: cleanNik,
      nomorEKTA: inputEkta.trim() || cleanNik,
      namaLengkap: inputNama.trim(),
      nomorHP: inputHp.trim() || '-',
      dpd: inputDpd,
      dpc: inputDpc || 'Umum',
      dprt: inputDprt.trim() || 'Umum',
      alamatLengkap: inputAlamat.trim() || undefined,
      jenisKelamin: inputGender,
      isPengurus: false,
      tingkatKepengurusan: 'Bukan Pengurus',
      jabatan: 'Anggota Biasa',
      status: 'Aktif',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      catatanMutasi: `Perekrutan mandiri oleh ${perekrutNama} (${perekrutJabatan}) via Portal Pengurus`,
      terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
      diubahOleh: session.adminName,

      kaderPerekrutKodeReferral: myReferralCode,
      kaderPerekrutNama: perekrutNama,
      kaderPerekrutJabatan: perekrutJabatan,
      kaderPerekrutNik: perekrutNik,

      ketuaLangsungNik: ketuaLangsung?.nik || undefined,
      ketuaLangsungNama: ketuaLangsung?.nama || undefined,
      ketuaLangsungJabatan: ketuaLangsung?.jabatan || undefined,
      ketuaLangsungTingkat: ketuaLangsung?.tingkat || undefined,
    };

    onAddMember(newMember);

    setIsSubmitting(false);
    setFormSuccess(
      `Kader ${newMember.namaLengkap} berhasil didaftarkan dan langsung terhubung dengan akun kepengurusan Anda!`
    );

    setInputNik('');
    setInputEkta('');
    setInputNama('');
    setInputHp('');
    setInputAlamat('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Form Pendaftaran Kader Mandiri (Via Jalur Referral Anda)</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Daftarkan calon anggota secara langsung di tempat. Kader akan otomatis terdata dalam
          jaringan kepengurusan Anda.
        </p>
      </div>

      {formSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleRegisterMember} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nomor NIK KTP (16 Digit) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={16}
              value={inputNik}
              onChange={(e) => setInputNik(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="7105..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {inputNik.length}/16 digit {inputNik.length === 16 ? '✓ Lengkap' : ''}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nama Lengkap Calon Kader <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={inputNama}
              onChange={(e) => setInputNama(e.target.value)}
              placeholder="Sesuai KTP"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nomor WhatsApp / HP
            </label>
            <input
              type="text"
              value={inputHp}
              onChange={(e) => setInputHp(e.target.value)}
              placeholder="0812..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nomor E-KTA (Opsional)
            </label>
            <input
              type="text"
              value={inputEkta}
              onChange={(e) => setInputEkta(e.target.value)}
              placeholder="Sama dengan NIK jika kosong"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              DPD (Kabupaten / Kota)
            </label>
            <select
              value={inputDpd}
              onChange={(e) => {
                setInputDpd(e.target.value);
                const reg = SULUT_REGIONS.find((r) => r.name === e.target.value);
                if (reg && reg.subdistricts.length > 0) {
                  setInputDpc(reg.subdistricts[0].name);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              {SULUT_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              DPC (Kecamatan)
            </label>
            <select
              value={inputDpc}
              onChange={(e) => setInputDpc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              {availableSubdistricts.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  Kec. {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              DPRt (Kelurahan / Desa)
            </label>
            <input
              type="text"
              value={inputDprt}
              onChange={(e) => setInputDprt(e.target.value)}
              placeholder="Contoh: Ranomeida"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Jenis Kelamin
            </label>
            <select
              value={inputGender}
              onChange={(e) => setInputGender(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3.5">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Alamat Domisili Lengkap
            </label>
            <input
              type="text"
              value={inputAlamat}
              onChange={(e) => setInputAlamat(e.target.value)}
              placeholder="Nama jalan, nomor rumah, RT/RW..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-60 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Anggota Baru'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
