import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { Member, UserSession, DirectLeaderInfo } from '../../types';
import { SULUT_REGIONS } from '../../data/sulutRegions';
import { isDpdMatch, isDpcMatch, isDprtMatch } from '../../utils/structureReadinessUtils';

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
  // 1. DPD Locking & Resolution
  const rawUserDpd =
    (session.dpdAccess && session.dpdAccess !== 'ALL' ? session.dpdAccess : null) ||
    (activePengurusMember?.dpd && activePengurusMember.dpd !== '-' ? activePengurusMember.dpd : '');

  const matchedDpdRegion = useMemo(() => {
    if (!rawUserDpd) return null;
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, rawUserDpd)) || null;
  }, [rawUserDpd]);

  const canonicalDpdName = matchedDpdRegion ? matchedDpdRegion.name : (rawUserDpd || SULUT_REGIONS[0].name);

  // DPD terkunci jika bukan SUPER_ADMIN / ADMIN_DPW dan user memiliki wilayah DPD penugasan
  const isDpdLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    Boolean(rawUserDpd);

  const lockedDpdName = isDpdLocked ? canonicalDpdName : '';

  // 2. DPC Locking & Resolution
  const rawUserDpc =
    (session.dpcAccess && session.dpcAccess !== 'ALL' && session.dpcAccess !== 'Umum (DPD)' && session.dpcAccess !== '-' ? session.dpcAccess : null) ||
    (activePengurusMember?.dpc && activePengurusMember.dpc !== '-' ? activePengurusMember.dpc : '');

  const isDpcRoleOrLevel =
    session.role === 'ADMIN_DPC' ||
    session.role === 'ADMIN_DPRT' ||
    activePengurusMember?.tingkatKepengurusan === 'DPC' ||
    activePengurusMember?.tingkatKepengurusan === 'DPRt';

  const isDpcLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    isDpcRoleOrLevel &&
    Boolean(rawUserDpc);

  const matchedSubdistrict = useMemo(() => {
    if (!rawUserDpc || !matchedDpdRegion) return null;
    return matchedDpdRegion.subdistricts.find((s) => isDpcMatch(s.name, rawUserDpc)) || null;
  }, [rawUserDpc, matchedDpdRegion]);

  const canonicalDpcName = matchedSubdistrict ? matchedSubdistrict.name : rawUserDpc;
  const lockedDpcName = isDpcLocked ? canonicalDpcName : '';

  // 3. DPRt Locking & Resolution
  const rawUserDprt =
    (session.dprtAccess && session.dprtAccess !== 'ALL' && session.dprtAccess !== 'Pusat/Umum' && session.dprtAccess !== '-' ? session.dprtAccess : null) ||
    (activePengurusMember?.dprt && activePengurusMember.dprt !== '-' ? activePengurusMember.dprt : '');

  const isDprtRoleOrLevel =
    session.role === 'ADMIN_DPRT' ||
    activePengurusMember?.tingkatKepengurusan === 'DPRt';

  const isDprtLocked =
    session.role !== 'SUPER_ADMIN' &&
    session.role !== 'ADMIN_DPW' &&
    isDprtRoleOrLevel &&
    Boolean(rawUserDprt);

  const lockedDprtName = isDprtLocked ? rawUserDprt : '';

  // State inisialisasi form
  const defaultDpd = isDpdLocked ? lockedDpdName : canonicalDpdName;
  const defaultDpc = isDpcLocked
    ? lockedDpcName
    : (matchedDpdRegion?.subdistricts[0]?.name || activePengurusMember?.dpc || '');
  const defaultDprt = isDprtLocked ? lockedDprtName : (activePengurusMember?.dprt || '');

  const [inputNik, setInputNik] = useState<string>('');
  const [inputEkta, setInputEkta] = useState<string>('');
  const [inputNama, setInputNama] = useState<string>('');
  const [inputHp, setInputHp] = useState<string>('');
  const [inputDpd, setInputDpd] = useState<string>(defaultDpd);
  const [inputDpc, setInputDpc] = useState<string>(defaultDpc);
  const [inputDprt, setInputDprt] = useState<string>(defaultDprt);
  const [inputAlamat, setInputAlamat] = useState<string>('');
  const [inputEmail, setInputEmail] = useState<string>('');
  const [inputSosmed, setInputSosmed] = useState<string>('');
  const [inputGender, setInputGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sinkronisasi DPD saat lock aktif
  useEffect(() => {
    if (isDpdLocked) {
      setInputDpd(lockedDpdName);
    } else if (defaultDpd) {
      setInputDpd(defaultDpd);
    }
  }, [isDpdLocked, lockedDpdName, defaultDpd]);

  // Hitung wilayah dan kecamatan yang sedang aktif
  const effectiveDpd = isDpdLocked ? lockedDpdName : inputDpd;
  const currentRegion = useMemo(() => {
    return SULUT_REGIONS.find((r) => isDpdMatch(r.name, effectiveDpd)) || SULUT_REGIONS[0];
  }, [effectiveDpd]);

  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];

  // Sinkronisasi DPC saat lock aktif atau DPD berganti
  useEffect(() => {
    if (isDpcLocked) {
      setInputDpc(lockedDpcName);
    } else if (availableSubdistricts.length > 0) {
      const match = availableSubdistricts.some((s) => isDpcMatch(s.name, inputDpc));
      if (!match) {
        setInputDpc(availableSubdistricts[0].name);
      }
    }
  }, [isDpcLocked, lockedDpcName, availableSubdistricts, inputDpc]);

  // Sinkronisasi DPRt saat lock aktif
  useEffect(() => {
    if (isDprtLocked) {
      setInputDprt(lockedDprtName);
    }
  }, [isDprtLocked, lockedDprtName]);

  const effectiveDpc = isDpcLocked ? lockedDpcName : inputDpc;
  const currentSubdistrict = useMemo(() => {
    return availableSubdistricts.find((s) => isDpcMatch(s.name, effectiveDpc)) || null;
  }, [availableSubdistricts, effectiveDpc]);

  const availableVillages = currentSubdistrict ? currentSubdistrict.villages : [];

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

    // STRICT TERRITORY VALIDATION: Hak akses teritorial sesuai wilayah akun
    const finalDpd = isDpdLocked ? lockedDpdName : inputDpd;
    const finalDpc = isDpcLocked ? lockedDpcName : (inputDpc || 'Umum');
    const finalDprt = isDprtLocked ? lockedDprtName : (inputDprt.trim() || 'Umum');

    if (isDpdLocked && !isDpdMatch(finalDpd, lockedDpdName)) {
      setFormError(`Hak Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di wilayah ${lockedDpdName}.`);
      return;
    }

    if (isDpcLocked && !isDpcMatch(finalDpc, lockedDpcName)) {
      setFormError(`Hak Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kecamatan ${lockedDpcName}.`);
      return;
    }

    if (isDprtLocked && !isDprtMatch(finalDprt, lockedDprtName)) {
      setFormError(`Hak Akses Dibatasi: Akun Anda hanya berwenang merekrut kader di kelurahan/desa ${lockedDprtName}.`);
      return;
    }

    setIsSubmitting(true);

    const newMember: Member = {
      nik: cleanNik,
      nomorEKTA: inputEkta.trim() || cleanNik,
      namaLengkap: inputNama.trim(),
      nomorHP: inputHp.trim() || '-',
      email: inputEmail.trim() || undefined,
      sosmed: inputSosmed.trim() || undefined,
      dpd: finalDpd,
      dpc: finalDpc,
      dprt: finalDprt,
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
      kaderPerekrutDpd: finalDpd,

      ketuaLangsungNik: ketuaLangsung?.nik || undefined,
      ketuaLangsungNama: ketuaLangsung?.nama || undefined,
      ketuaLangsungJabatan: ketuaLangsung?.jabatan || undefined,
      ketuaLangsungTingkat: ketuaLangsung?.tingkat || undefined,
    };

    onAddMember(newMember);

    setIsSubmitting(false);
    setFormSuccess(
      `Kader ${newMember.namaLengkap} berhasil didaftarkan di wilayah ${newMember.dpd} (${newMember.dpc}) dan langsung terhubung dengan akun kepengurusan Anda!`
    );

    setInputNik('');
    setInputEkta('');
    setInputNama('');
    setInputHp('');
    setInputEmail('');
    setInputSosmed('');
    setInputAlamat('');
    if (!isDprtLocked) {
      setInputDprt('');
    }
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
          jaringan kepengurusan Anda sesuai wilayah kewenangan akun.
        </p>
      </div>

      {/* Scope Territory Badge */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            {isDpdLocked ? (
              <>
                Wilayah Kewenangan Perekrutan: <strong className="text-blue-700 dark:text-blue-300">{lockedDpdName}</strong>
                {isDpcLocked && <span> &rsaquo; <strong>Kec. {lockedDpcName}</strong></span>}
                {isDprtLocked && <span> &rsaquo; <strong>{lockedDprtName}</strong></span>}
              </>
            ) : (
              <span>Cakupan Perekrutan: <strong>Seluruh Wilayah Sulawesi Utara</strong> (Akses Penuh DPW/Super Admin)</span>
            )}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-[10px] font-bold shrink-0 self-start sm:self-auto">
          {isDpdLocked ? <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
          <span>{isDpdLocked ? `Terkunci: Wilayah ${session.role.replace('ADMIN_', '') || 'Pengurus'}` : 'Akses Tanpa Batas'}</span>
        </div>
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>DPD (Kabupaten / Kota)</span>
              {isDpdLocked && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
            </label>
            <select
              value={effectiveDpd}
              disabled={isDpdLocked}
              onChange={(e) => {
                if (isDpdLocked) return;
                setInputDpd(e.target.value);
                const reg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, e.target.value));
                if (reg && reg.subdistricts.length > 0) {
                  setInputDpc(reg.subdistricts[0].name);
                }
              }}
              className={`w-full border rounded-lg p-2 text-xs transition-colors ${
                isDpdLocked
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-not-allowed font-medium'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600'
              }`}
            >
              {isDpdLocked ? (
                <option value={lockedDpdName}>{lockedDpdName}</option>
              ) : (
                SULUT_REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>DPC (Kecamatan)</span>
              {isDpcLocked && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
            </label>
            <select
              value={effectiveDpc}
              disabled={isDpcLocked}
              onChange={(e) => {
                if (isDpcLocked) return;
                setInputDpc(e.target.value);
              }}
              className={`w-full border rounded-lg p-2 text-xs transition-colors ${
                isDpcLocked
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-not-allowed font-medium'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600'
              }`}
            >
              {isDpcLocked ? (
                <option value={lockedDpcName}>Kec. {lockedDpcName}</option>
              ) : (
                availableSubdistricts.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    Kec. {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
              <span>DPRt (Kelurahan / Desa)</span>
              {isDprtLocked && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
            </label>
            <input
              type="text"
              list={!isDprtLocked && availableVillages.length > 0 ? "pengurus-form-villages" : undefined}
              value={isDprtLocked ? lockedDprtName : inputDprt}
              disabled={isDprtLocked}
              readOnly={isDprtLocked}
              onChange={(e) => {
                if (isDprtLocked) return;
                setInputDprt(e.target.value);
              }}
              placeholder={isDprtLocked ? lockedDprtName : "Contoh: Ranomeida"}
              className={`w-full border rounded-lg p-2 text-xs transition-colors ${
                isDprtLocked
                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-not-allowed font-medium'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600'
              }`}
            />
            {!isDprtLocked && availableVillages.length > 0 && (
              <datalist id="pengurus-form-villages">
                {availableVillages.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            )}
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

        {/* Row 3: Kontak Digital (Email & Sosmed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Alamat Email (Opsional)
            </label>
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="kader@email.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Akun Media Sosial (Opsional)
            </label>
            <input
              type="text"
              value={inputSosmed}
              onChange={(e) => setInputSosmed(e.target.value)}
              placeholder="@username IG / Facebook / TikTok"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
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
