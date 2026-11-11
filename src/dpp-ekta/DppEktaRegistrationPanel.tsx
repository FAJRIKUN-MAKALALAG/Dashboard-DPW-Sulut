import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe,
  AlertCircle,
  CreditCard,
  RefreshCw,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { Member } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch, isDpcMatch } from '../utils/structureReadinessUtils';
import { compressImageFile } from '../utils/imageUtils';
import { MemberService } from '../services/memberService';
import {
  ExtractedKtpData,
  KtpImageQualityReport,
  decodeIndonesianNik,
} from '../ktp-scanner';
import {
  dppEktaService,
  DppConnectionStatus,
  DppCreateKtaResult,
} from './dppEktaService';
import { DppEktaMemberPickerTab } from './DppEktaMemberPickerTab';
import { DppEktaFormTab } from './DppEktaFormTab';
import { DppEktaCardViewerTab } from './DppEktaCardViewerTab';

interface DppEktaRegistrationPanelProps {
  members: Member[];
  initialMember?: Member | null;
  onMemberEktaUpdated?: (nik: string, nokta: string, updatedMember?: Member) => void;
  onClose?: () => void;
}

export const DppEktaRegistrationPanel: React.FC<DppEktaRegistrationPanelProps> = ({
  members,
  initialMember,
  onMemberEktaUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'pick_member' | 'card_viewer'>(
    initialMember ? 'form' : 'pick_member'
  );

  const [connStatus, setConnStatus] = useState<DppConnectionStatus | null>(null);
  const [checkingConn, setCheckingConn] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [ektaFilter, setEktaFilter] = useState<'ALL' | 'UNREGISTERED' | 'REGISTERED'>('UNREGISTERED');
  const [loadingMemberNik, setLoadingMemberNik] = useState<string | null>(null);

  const [showKtpScanner, setShowKtpScanner] = useState(false);
  const [ktpQuality, setKtpQuality] = useState<KtpImageQualityReport | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedKtpData | null>(null);

  const [nik, setNik] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [golonganDarah, setGolonganDarah] = useState('');
  const [statusPerkawinan, setStatusPerkawinan] = useState('B');
  const [agama, setAgama] = useState('Kristen Protestan');
  const [pendidikan, setPendidikan] = useState('4');
  const [pekerjaan, setPekerjaan] = useState('Wiraswasta');
  const [sayap, setSayap] = useState('');

  const [dpd, setDpd] = useState(SULUT_REGIONS[0].name);
  const [dpc, setDpc] = useState(SULUT_REGIONS[0].subdistricts[0]?.name || '');
  const [dprt, setDprt] = useState('');
  const [rtNumber, setRtNumber] = useState('1');
  const [rwNumber, setRwNumber] = useState('1');
  const [alamatLengkap, setAlamatLengkap] = useState('');

  const [nomorHP, setNomorHP] = useState('');
  const [email, setEmail] = useState('');
  const [fotoKtpUrl, setFotoKtpUrl] = useState('');
  const [fotoProfilUrl, setFotoProfilUrl] = useState('');
  const [saveToLocalMembers, setSaveToLocalMembers] = useState(true);

  const [checkingNikStatus, setCheckingNikStatus] = useState(false);
  const [nikDppCheckInfo, setNikDppCheckInfo] = useState<{
    checked: boolean;
    existsInDpp: boolean;
    existsInLocal: boolean;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<DppCreateKtaResult | null>(null);
  const [viewingNokta, setViewingNokta] = useState<string>('');
  const [viewingMemberName, setViewingMemberName] = useState<string>('');
  const [copiedEkta, setCopiedEkta] = useState(false);

  const checkDppStatus = async () => {
    setCheckingConn(true);
    try {
      const st = await dppEktaService.getStatus();
      setConnStatus(st);
    } catch {
      setConnStatus({
        configured: false,
        connected: false,
        message: 'Gagal memeriksa koneksi ke server backend.',
      });
    } finally {
      setCheckingConn(false);
    }
  };

  useEffect(() => {
    checkDppStatus();
  }, []);

  const populateFromMember = async (m: Member) => {
    setLoadingMemberNik(m.nik);
    setErrorMessage(null);
    setCreatedResult(null);
    setNikDppCheckInfo(null);

    let fullMember = m;
    try {
      const fetched = await MemberService.getByNik(m.nik);
      if (fetched) fullMember = fetched;
    } catch {
      /* gunakan data m yang ada */
    } finally {
      setLoadingMemberNik(null);
    }

    const cleanNikVal = (fullMember.nik || '').replace(/[^0-9]/g, '');
    const decoded = decodeIndonesianNik(cleanNikVal);

    setNik(cleanNikVal);
    setNamaLengkap(fullMember.namaLengkap || '');
    setTempatLahir(fullMember.tempatLahir || '');
    if ((fullMember as any).golonganDarah) {
      setGolonganDarah((fullMember as any).golonganDarah);
    }
    setTanggalLahir(fullMember.tanggalLahir || decoded.tanggalLahir || '1990-01-01');
    setJenisKelamin(
      fullMember.jenisKelamin === 'Perempuan' || decoded.jenisKelamin === 'Perempuan'
        ? 'Perempuan'
        : 'Laki-laki'
    );
    setAgama(fullMember.agama || 'Kristen Protestan');
    setPekerjaan(fullMember.pekerjaan || 'Wiraswasta');
    setDpd(fullMember.dpd || SULUT_REGIONS[0].name);
    setDpc(fullMember.dpc && fullMember.dpc !== '-' ? fullMember.dpc : '');
    setDprt(fullMember.dprt && fullMember.dprt !== '-' ? fullMember.dprt : '');
    setAlamatLengkap(
      fullMember.alamatLengkap ||
        `Kel/Desa ${fullMember.dprt || 'Umum'}, Kec. ${fullMember.dpc || 'Umum'}, ${fullMember.dpd}`
    );
    setNomorHP(fullMember.nomorHP && fullMember.nomorHP !== '-' ? fullMember.nomorHP : '');
    setEmail(fullMember.email || '');
    setFotoKtpUrl(fullMember.fotoKtpUrl || '');
    setFotoProfilUrl(fullMember.fotoProfilUrl || '');
    setActiveSubTab('form');
  };

  useEffect(() => {
    if (initialMember) {
      populateFromMember(initialMember);
    }
  }, [initialMember]);

  const cleanNik = useMemo(() => nik.replace(/[^0-9]/g, '').trim(), [nik]);
  const lastAutoDecodedNikRef = useRef<string>('');

  useEffect(() => {
    if (cleanNik.length === 16 && lastAutoDecodedNikRef.current !== cleanNik) {
      lastAutoDecodedNikRef.current = cleanNik;
      const dec = decodeIndonesianNik(cleanNik);
      if (dec.isValidFormat) {
        if (!tanggalLahir && dec.tanggalLahir) setTanggalLahir(dec.tanggalLahir);
        if (dec.jenisKelamin) setJenisKelamin(dec.jenisKelamin);
        if (!tempatLahir && dec.tempatLahirSuggestion) setTempatLahir(dec.tempatLahirSuggestion);
        if (dec.dpdName) {
          const matchedReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, dec.dpdName));
          if (matchedReg) setDpd(matchedReg.name);
        }
      }
    } else if (cleanNik.length < 16) {
      lastAutoDecodedNikRef.current = '';
    }
  }, [cleanNik]);

  const currentRegion = useMemo(
    () => SULUT_REGIONS.find((r) => isDpdMatch(r.name, dpd)) || SULUT_REGIONS[0],
    [dpd]
  );
  const availableSubdistricts = currentRegion ? currentRegion.subdistricts : [];
  const currentSubdistrict = useMemo(
    () => availableSubdistricts.find((s) => isDpcMatch(s.name, dpc)) || availableSubdistricts[0] || null,
    [availableSubdistricts, dpc]
  );
  const availableVillages = currentSubdistrict ? currentSubdistrict.villages : [];

  const stats = useMemo(() => {
    let registered = 0;
    let unregistered = 0;
    members.forEach((m) => {
      if (dppEktaService.hasOfficialDppEkta(m)) registered++;
      else unregistered++;
    });
    return { total: members.length, registered, unregistered };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members
      .filter((m) => {
        const hasEkta = dppEktaService.hasOfficialDppEkta(m);
        if (ektaFilter === 'REGISTERED' && !hasEkta) return false;
        if (ektaFilter === 'UNREGISTERED' && hasEkta) return false;
        if (!q) return true;
        return (
          (m.namaLengkap || '').toLowerCase().includes(q) ||
          (m.nik || '').toLowerCase().includes(q) ||
          (m.nomorEKTA || '').toLowerCase().includes(q) ||
          (m.dpd || '').toLowerCase().includes(q) ||
          (m.dpc || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 60);
  }, [members, searchQuery, ektaFilter]);

  const handleCheckNikInDpp = async () => {
    if (cleanNik.length < 9) {
      setErrorMessage('Masukkan minimal 9-16 digit NIK terlebih dahulu.');
      return;
    }
    setCheckingNikStatus(true);
    setErrorMessage(null);
    try {
      const res = await dppEktaService.checkKtp(cleanNik);
      setNikDppCheckInfo({
        checked: true,
        existsInDpp: res.existsInDpp,
        existsInLocal: res.existsInLocal,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memeriksa NIK ke server DPP.');
    } finally {
      setCheckingNikStatus(false);
    }
  };

  const handleScanComplete = (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => {
    setFotoKtpUrl(result.fotoKtpUrl);
    if (result.croppedFaceDataUrl && !fotoProfilUrl) {
      setFotoProfilUrl(result.croppedFaceDataUrl);
    }
    setKtpQuality(result.quality);
    setExtractedData(result.extracted);

    const ext: any = result.extracted;
    if (ext.nik) setNik(ext.nik);
    if (ext.namaLengkap) setNamaLengkap(ext.namaLengkap);
    if (ext.tempatLahir) setTempatLahir(ext.tempatLahir);
    if (ext.tanggalLahir) setTanggalLahir(ext.tanggalLahir);
    if (ext.jenisKelamin) setJenisKelamin(ext.jenisKelamin);
    if (ext.agama) setAgama(ext.agama);
    if (ext.pekerjaan) setPekerjaan(ext.pekerjaan);
    if (ext.alamatLengkap) setAlamatLengkap(ext.alamatLengkap);
    if (ext.matchedDpd || ext.dpd) setDpd(ext.matchedDpd || ext.dpd);
    if (ext.matchedDpc || ext.dpc) setDpc(ext.matchedDpc || ext.dpc);
    if (ext.matchedDprt || ext.dprt) setDprt(ext.matchedDprt || ext.dprt);
    setShowKtpScanner(false);
  };

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'ktp' | 'profil'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(
        file,
        target === 'ktp' ? 1100 : 600,
        0.85
      );
      if (target === 'ktp') setFotoKtpUrl(compressed);
      else setFotoProfilUrl(compressed);
    } catch {
      setErrorMessage('Gagal memproses berkas gambar.');
    }
  };

  const handleSubmitToDpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCreatedResult(null);

    if (cleanNik.length < 9 || cleanNik.length > 16) {
      setErrorMessage('NIK harus terdiri dari 9 hingga 16 digit angka.');
      return;
    }
    if (!namaLengkap.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { result, mappedMember } = await dppEktaService.createKta({
        nik: cleanNik,
        namaLengkap: namaLengkap.trim(),
        tempatLahir: tempatLahir.trim() || 'MANADO',
        tanggalLahir: tanggalLahir || '1990-01-01',
        jenisKelamin,
        golonganDarah: golonganDarah || 'O',
        statusPerkawinan,
        agama,
        pendidikan,
        pekerjaan: pekerjaan.trim() || 'Wiraswasta',
        sayap,
        dpd,
        dpc: dpc || currentSubdistrict?.name || 'Umum',
        dprt: dprt || availableVillages[0] || 'Umum',
        rtNumber: rtNumber || '1',
        rwNumber: rwNumber || '1',
        alamatLengkap:
          alamatLengkap.trim() ||
          `Kel. ${dprt || 'Umum'}, Kec. ${dpc || 'Umum'}, ${dpd}`,
        nomorHP: nomorHP.trim() || '081234567890',
        email: email.trim() || undefined,
        fotoKtpUrl: fotoKtpUrl || undefined,
        fotoProfilUrl: fotoProfilUrl || undefined,
        saveToLocalMembers,
      });

      setCreatedResult(result);
      if (onMemberEktaUpdated && result.nomor_ekta) {
        onMemberEktaUpdated(cleanNik, result.nomor_ekta, mappedMember);
      }
      if (result.nomor_ekta) {
        setViewingNokta(result.nomor_ekta);
        setViewingMemberName(namaLengkap.trim());
        setActiveSubTab('card_viewer');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Gagal menerbitkan e-KTA ke portal Digital NasDem DPP.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEkta = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEkta(true);
    setTimeout(() => setCopiedEkta(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Banner Status Koneksi Portal DPP Pusat */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A3282] border border-blue-400/30 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Pusat Penerbitan e-KTA Resmi DPP Partai NasDem
              </h3>
              {connStatus?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Terhubung ({connStatus.adminEmail})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {checkingConn ? 'Memeriksa koneksi...' : 'Siap Menghubungkan'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Terpisah dari pendaftaran keanggotaan lokal — langsung membuat e-KTA resmi di{' '}
              <span className="font-mono text-amber-300">digital.partainasdem.id</span> tanpa OTP email.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={checkDppStatus}
          disabled={checkingConn}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingConn ? 'animate-spin' : ''}`} />
          <span>Cek Koneksi DPP</span>
        </button>
      </div>

      {/* Navigasi Sub-Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('pick_member')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'pick_member'
              ? 'bg-[#1A3282] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. Pilih dari Anggota ({stats.unregistered} Belum e-KTA)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('form')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'form'
              ? 'bg-[#1A3282] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. Formulir Pendaftaran e-KTA DPP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('card_viewer')}
          className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeSubTab === 'card_viewer'
              ? 'bg-[#1A3282] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>3. Lihat &amp; Unduh Kartu e-KTA DPP</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SUB-TAB 1 */}
      {activeSubTab === 'pick_member' && (
        <DppEktaMemberPickerTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          ektaFilter={ektaFilter}
          setEktaFilter={setEktaFilter}
          stats={stats}
          filteredMembers={filteredMembers}
          loadingMemberNik={loadingMemberNik}
          onSelectMemberForForm={populateFromMember}
          onViewMemberCard={(m) => {
            setViewingNokta(m.nomorEKTA);
            setViewingMemberName(m.namaLengkap);
            setActiveSubTab('card_viewer');
          }}
        />
      )}

      {/* SUB-TAB 2 */}
      {activeSubTab === 'form' && (
        <DppEktaFormTab
          nik={nik}
          setNik={setNik}
          cleanNik={cleanNik}
          namaLengkap={namaLengkap}
          setNamaLengkap={setNamaLengkap}
          tempatLahir={tempatLahir}
          setTempatLahir={setTempatLahir}
          tanggalLahir={tanggalLahir}
          setTanggalLahir={setTanggalLahir}
          jenisKelamin={jenisKelamin}
          setJenisKelamin={setJenisKelamin}
          golonganDarah={golonganDarah}
          setGolonganDarah={setGolonganDarah}
          statusPerkawinan={statusPerkawinan}
          setStatusPerkawinan={setStatusPerkawinan}
          agama={agama}
          setAgama={setAgama}
          pendidikan={pendidikan}
          setPendidikan={setPendidikan}
          pekerjaan={pekerjaan}
          setPekerjaan={setPekerjaan}
          sayap={sayap}
          setSayap={setSayap}
          dpd={dpd}
          setDpd={setDpd}
          dpc={dpc}
          setDpc={setDpc}
          dprt={dprt}
          setDprt={setDprt}
          rtNumber={rtNumber}
          setRtNumber={setRtNumber}
          rwNumber={rwNumber}
          setRwNumber={setRwNumber}
          alamatLengkap={alamatLengkap}
          setAlamatLengkap={setAlamatLengkap}
          nomorHP={nomorHP}
          setNomorHP={setNomorHP}
          email={email}
          setEmail={setEmail}
          fotoKtpUrl={fotoKtpUrl}
          setFotoKtpUrl={setFotoKtpUrl}
          fotoProfilUrl={fotoProfilUrl}
          saveToLocalMembers={saveToLocalMembers}
          setSaveToLocalMembers={setSaveToLocalMembers}
          showKtpScanner={showKtpScanner}
          setShowKtpScanner={setShowKtpScanner}
          ktpQuality={ktpQuality}
          extractedData={extractedData}
          onScanComplete={handleScanComplete}
          onUploadFile={handleUploadFile}
          checkingNikStatus={checkingNikStatus}
          nikDppCheckInfo={nikDppCheckInfo}
          setNikDppCheckInfo={setNikDppCheckInfo}
          onCheckNikInDpp={handleCheckNikInDpp}
          availableSubdistricts={availableSubdistricts}
          availableVillages={availableVillages}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitToDpp}
        />
      )}

      {/* SUB-TAB 3 */}
      {activeSubTab === 'card_viewer' && (
        <DppEktaCardViewerTab
          createdResult={createdResult}
          viewingNokta={viewingNokta}
          setViewingNokta={setViewingNokta}
          viewingMemberName={viewingMemberName}
          copiedEkta={copiedEkta}
          onCopyEkta={handleCopyEkta}
        />
      )}
    </div>
  );
};
