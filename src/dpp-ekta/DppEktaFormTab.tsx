import React from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { ExtractedKtpData, KtpImageQualityReport } from '../ktp-scanner';
import { DppEktaDocumentsSection } from './form/DppEktaDocumentsSection';
import { DppEktaIdentitySection } from './form/DppEktaIdentitySection';
import { DppEktaDomicileSection } from './form/DppEktaDomicileSection';

interface DppEktaFormTabProps {
  nik: string;
  setNik: (v: string) => void;
  cleanNik: string;
  namaLengkap: string;
  setNamaLengkap: (v: string) => void;
  tempatLahir: string;
  setTempatLahir: (v: string) => void;
  tanggalLahir: string;
  setTanggalLahir: (v: string) => void;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  setJenisKelamin: (v: 'Laki-laki' | 'Perempuan') => void;
  golonganDarah: string;
  setGolonganDarah: (v: string) => void;
  statusPerkawinan: string;
  setStatusPerkawinan: (v: string) => void;
  agama: string;
  setAgama: (v: string) => void;
  pendidikan: string;
  setPendidikan: (v: string) => void;
  pekerjaan: string;
  setPekerjaan: (v: string) => void;
  sayap: string;
  setSayap: (v: string) => void;
  dpd: string;
  setDpd: (v: string) => void;
  dpc: string;
  setDpc: (v: string) => void;
  dprt: string;
  setDprt: (v: string) => void;
  rtNumber: string;
  setRtNumber: (v: string) => void;
  rwNumber: string;
  setRwNumber: (v: string) => void;
  alamatLengkap: string;
  setAlamatLengkap: (v: string) => void;
  nomorHP: string;
  setNomorHP: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  fotoKtpUrl: string;
  setFotoKtpUrl: (v: string) => void;
  fotoProfilUrl: string;
  setFotoProfilUrl?: (v: string) => void;
  saveToLocalMembers: boolean;
  setSaveToLocalMembers: (v: boolean) => void;
  showKtpScanner: boolean;
  setShowKtpScanner: React.Dispatch<React.SetStateAction<boolean>>;
  ktpQuality: KtpImageQualityReport | null;
  extractedData: ExtractedKtpData | null;
  onScanComplete: (result: {
    fotoKtpUrl: string;
    croppedFaceDataUrl?: string;
    quality: KtpImageQualityReport;
    extracted: ExtractedKtpData;
  }) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>, target: 'ktp' | 'profil') => void;
  checkingNikStatus: boolean;
  nikDppCheckInfo: {
    checked: boolean;
    existsInDpp: boolean;
    nomorEktaDpp?: string;
    namaDpp?: string;
    existsInLocal: boolean;
  } | null;
  setNikDppCheckInfo: (v: null) => void;
  onCheckNikInDpp: () => void;
  onSyncExistingEkta?: () => void;
  isSyncingExisting?: boolean;
  manualEktaInput?: string;
  setManualEktaInput?: (v: string) => void;
  availableSubdistricts: { name: string; villages: string[] }[];
  availableVillages: string[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const DppEktaFormTab: React.FC<DppEktaFormTabProps> = (props) => {
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <DppEktaDocumentsSection
        fotoKtpUrl={props.fotoKtpUrl}
        setFotoKtpUrl={props.setFotoKtpUrl}
        fotoProfilUrl={props.fotoProfilUrl}
        setFotoProfilUrl={props.setFotoProfilUrl}
        showKtpScanner={props.showKtpScanner}
        setShowKtpScanner={props.setShowKtpScanner}
        ktpQuality={props.ktpQuality}
        extractedData={props.extractedData}
        onScanComplete={props.onScanComplete}
        onUploadFile={props.onUploadFile}
      />

      {/* Grid Desktop 12 Kolom: Biodata (7 Kolom) & Domisili/Kontak (5 Kolom) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <DppEktaIdentitySection
          nik={props.nik}
          setNik={props.setNik}
          cleanNik={props.cleanNik}
          namaLengkap={props.namaLengkap}
          setNamaLengkap={props.setNamaLengkap}
          tempatLahir={props.tempatLahir}
          setTempatLahir={props.setTempatLahir}
          tanggalLahir={props.tanggalLahir}
          setTanggalLahir={props.setTanggalLahir}
          jenisKelamin={props.jenisKelamin}
          setJenisKelamin={props.setJenisKelamin}
          golonganDarah={props.golonganDarah}
          setGolonganDarah={props.setGolonganDarah}
          statusPerkawinan={props.statusPerkawinan}
          setStatusPerkawinan={props.setStatusPerkawinan}
          agama={props.agama}
          setAgama={props.setAgama}
          pendidikan={props.pendidikan}
          setPendidikan={props.setPendidikan}
          pekerjaan={props.pekerjaan}
          setPekerjaan={props.setPekerjaan}
          checkingNikStatus={props.checkingNikStatus}
          nikDppCheckInfo={props.nikDppCheckInfo}
          setNikDppCheckInfo={props.setNikDppCheckInfo}
          onCheckNikInDpp={props.onCheckNikInDpp}
          onSyncExistingEkta={props.onSyncExistingEkta}
          isSyncingExisting={props.isSyncingExisting}
          manualEktaInput={props.manualEktaInput}
          setManualEktaInput={props.setManualEktaInput}
        />

        <DppEktaDomicileSection
          dpd={props.dpd}
          setDpd={props.setDpd}
          dpc={props.dpc}
          setDpc={props.setDpc}
          dprt={props.dprt}
          setDprt={props.setDprt}
          rtNumber={props.rtNumber}
          setRtNumber={props.setRtNumber}
          rwNumber={props.rwNumber}
          setRwNumber={props.setRwNumber}
          alamatLengkap={props.alamatLengkap}
          setAlamatLengkap={props.setAlamatLengkap}
          sayap={props.sayap}
          setSayap={props.setSayap}
          nomorHP={props.nomorHP}
          setNomorHP={props.setNomorHP}
          email={props.email}
          setEmail={props.setEmail}
          cleanNik={props.cleanNik}
          availableSubdistricts={props.availableSubdistricts}
          availableVillages={props.availableVillages}
        />
      </div>

      {/* Footer Submit ke DPP */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={props.saveToLocalMembers}
            onChange={(e) => props.setSaveToLocalMembers(e.target.checked)}
            className="w-4 h-4 rounded text-[#1A3282]"
          />
          <span>Simpan &amp; sinkronkan Nomor e-KTA DPP ini ke tabel Anggota DPW Sulut</span>
        </label>

        {props.nikDppCheckInfo?.existsInDpp ? (
          <button
            type="button"
            onClick={props.onSyncExistingEkta}
            disabled={props.isSyncingExisting || props.isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#FDB813] to-amber-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-60 touch-manipulation"
          >
            <RefreshCw className={`w-4 h-4 ${props.isSyncingExisting ? 'animate-spin' : ''}`} />
            <span>
              {props.isSyncingExisting
                ? 'Menyinkronkan e-KTA dari DPP Pusat...'
                : '⚡ Tarik & Sinkronkan e-KTA Resmi dari Pusat'}
            </span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={props.isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#1A3282] hover:bg-[#21409A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors disabled:opacity-60"
          >
            <Globe className={`w-4 h-4 ${props.isSubmitting ? 'animate-spin' : ''}`} />
            <span>
              {props.isSubmitting
                ? 'Mendaftarkan ke Server Digital NasDem DPP...'
                : 'Daftarkan & Terbitkan e-KTA Resmi DPP'}
            </span>
          </button>
        )}
      </div>
    </form>
  );
};
