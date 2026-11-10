import { decodeIndonesianNik, matchSulutTerritoryFromKtp } from './nikDecoder';

export interface ExtractedKtpData {
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: 'Laki-laki' | 'Perempuan' | '';
  alamatLengkap: string;
  rtRw: string;
  kelDesa: string;
  kecamatan: string;
  kabKota: string;
  agama: string;
  statusPerkawinan: string;
  pekerjaan: string;
  matchedDpd?: string;
  matchedDpc?: string;
  matchedDprt?: string;
  confidence: number; // 0 - 100
  rawText: string;
  croppedFaceDataUrl?: string;
}

/**
 * Memperbaiki karakter angka yang sering tertukar oleh OCR pada baris NIK / Tanggal
 */
function normalizeOcrDigits(str: string): string {
  return str
    .replace(/[OoQD]/g, '0')
    .replace(/[Il|!L]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[E]/g, '3')
    .replace(/[A]/g, '4')
    .replace(/[Ss$]/g, '5')
    .replace(/[Ggb]/g, '6')
    .replace(/[T?]/g, '7')
    .replace(/[B&]/g, '8')
    .replace(/[g]/g, '9');
}

function stripFieldLabel(line: string, labelPattern: RegExp): string {
  return line
    .replace(labelPattern, '')
    .replace(/^[\s:;.\-=_]+/, '')
    .replace(/[\s:;.\-=_]+$/, '')
    .trim();
}

export function toCleanTitleCase(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mem-parsing teks mentah hasil OCR e-KTP Indonesia menjadi objek terstruktur
 */
export function parseKtpOcrText(rawText: string): ExtractedKtpData {
  const lines = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let nik = '';
  let namaLengkap = '';
  let tempatLahir = '';
  let tanggalLahir = '';
  let jenisKelamin: 'Laki-laki' | 'Perempuan' | '' = '';
  let alamat = '';
  let rtRw = '';
  let kelDesa = '';
  let kecamatan = '';
  let kabKota = '';
  let agama = '';
  let statusPerkawinan = '';
  let pekerjaan = '';

  // 1. Cari NIK (16 digit)
  for (const line of lines) {
    if (/nik/i.test(line) || /\d{6,}/.test(line)) {
      const cleanedLine = normalizeOcrDigits(line.replace(/nik/gi, ''));
      const match16 = cleanedLine.match(/\d[\d\s]{14,18}\d/);
      if (match16) {
        const digitsOnly = match16[0].replace(/\D/g, '');
        if (digitsOnly.length >= 16) {
          nik = digitsOnly.slice(0, 16);
          break;
        }
      }
    }
  }

  if (!nik) {
    const allNormalized = normalizeOcrDigits(rawText);
    const any16 = allNormalized.match(/\b71\d{14}\b/) || allNormalized.match(/\b\d{16}\b/);
    if (any16) {
      nik = any16[0];
    }
  }

  // 2. Iterasi baris demi baris untuk mengekstrak field e-KTP
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    if (!kabKota && /\b(KABUPATEN|KOTA)\b/i.test(upper) && !/PROVINSI/i.test(upper)) {
      const kabMatch = upper.match(/\b(KABUPATEN|KOTA)\s+[A-Z\s]+/);
      if (kabMatch) {
        kabKota = toCleanTitleCase(kabMatch[0]);
      }
    }

    if (!namaLengkap && /\b(NAMA|NANA|MAMA)\b/i.test(upper) && !/AGAMA|KECAMATAN/i.test(upper)) {
      let val = stripFieldLabel(line, /^.*?\b(NAMA|NANA|MAMA)\b/i);
      if (!val && i + 1 < lines.length && !/TEMPAT|LAHIR/i.test(lines[i + 1])) {
        val = lines[i + 1];
      }
      val = val.replace(/[^a-zA-Z\s.,']/g, '').trim();
      if (val.length >= 2) {
        namaLengkap = val.toUpperCase();
      }
    }

    if (
      (!tempatLahir || !tanggalLahir) &&
      (/\b(TEMPAT|TGL|LAHIR|TMPT)\b/i.test(upper) || /\d{2}\s*[-/]\s*\d{2}\s*[-/]\s*(19|20)\d{2}/.test(line))
    ) {
      const val = stripFieldLabel(line, /^.*?\b(LAHIR|TGL\s*LAHIR|TEMPAT\/TGL\s*LAHIR)\b/i);
      const dateMatch = normalizeOcrDigits(val).match(/(\d{2})\s*[-/.\s]\s*(\d{2})\s*[-/.\s]\s*((?:19|20)\d{2})/);
      if (dateMatch) {
        const [, d, m, y] = dateMatch;
        tanggalLahir = `${y}-${m}-${d}`;
        const beforeDate = val.slice(0, dateMatch.index).replace(/[^a-zA-Z\s]/g, '').trim();
        if (beforeDate.length >= 2) {
          tempatLahir = toCleanTitleCase(beforeDate);
        }
      } else {
        const parts = val.split(/[,]/);
        if (parts[0]) {
          const cleanPlace = parts[0].replace(/[^a-zA-Z\s]/g, '').trim();
          if (cleanPlace.length >= 2) tempatLahir = toCleanTitleCase(cleanPlace);
        }
      }
    }

    if (!jenisKelamin && /\b(JENIS\s*KELAMIN|KELAMIN|LAKI|PEREMPUAN|WANITA|PRIA)\b/i.test(upper)) {
      if (/PEREMPUAN|WANITA/i.test(upper)) {
        jenisKelamin = 'Perempuan';
      } else if (/LAKI/i.test(upper)) {
        jenisKelamin = 'Laki-laki';
      }
    }

    if (!alamat && /\b(ALAMAT|ALANAT)\b/i.test(upper)) {
      const val = stripFieldLabel(line, /^.*?\b(ALAMAT|ALANAT)\b/i)
        .replace(/\bGOL\.?\s*DARAH.*$/i, '')
        .trim();
      if (val.length >= 2) {
        alamat = toCleanTitleCase(val);
      }
    }

    if (!rtRw && /\b(RT\s*\/?\s*RW|RTRW)\b/i.test(upper)) {
      const normRt = normalizeOcrDigits(line);
      const rtMatch = normRt.match(/(\d{2,3})\s*[/|-]\s*(\d{2,3})/);
      if (rtMatch) {
        rtRw = `${rtMatch[1].padStart(3, '0')}/${rtMatch[2].padStart(3, '0')}`;
      }
    }

    if (!kelDesa && /\b(KEL\s*\/?\s*DESA|KELURAHAN|DESA|KEVDESA)\b/i.test(upper)) {
      const val = stripFieldLabel(line, /^.*?\b(KEL\s*\/?\s*DESA|KELURAHAN|DESA|KEVDESA)\b/i)
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim();
      if (val.length >= 2) {
        kelDesa = toCleanTitleCase(val);
      }
    }

    if (!kecamatan && /\b(KECAMATAN|KECANATAN|KEC\.)\b/i.test(upper)) {
      const val = stripFieldLabel(line, /^.*?\b(KECAMATAN|KECANATAN|KEC\.)\b/i)
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim();
      if (val.length >= 2) {
        kecamatan = toCleanTitleCase(val);
      }
    }

    if (!agama && /\b(AGAMA|ISLAM|KRISTEN|KATOLIK|KATHOLIK|HINDU|BUDDHA|BUDHA|KHONGHUCU|KONGHUCU)\b/i.test(upper)) {
      if (/KRISTEN/i.test(upper)) agama = 'Kristen Protestan';
      else if (/KATOLIK|KATHOLIK/i.test(upper)) agama = 'Katolik';
      else if (/ISLAM|ISLAN/i.test(upper)) agama = 'Islam';
      else if (/HINDU/i.test(upper)) agama = 'Hindu';
      else if (/BUDDHA|BUDHA/i.test(upper)) agama = 'Buddha';
      else if (/KHONGHUCU|KONGHUCU/i.test(upper)) agama = 'Khonghucu';
    }

    if (!statusPerkawinan && /\b(PERKAWINAN|KAWIN|CERAI)\b/i.test(upper)) {
      if (/BELUM\s*KAWIN/i.test(upper)) statusPerkawinan = 'Belum Kawin';
      else if (/CERAI\s*HIDUP/i.test(upper)) statusPerkawinan = 'Cerai Hidup';
      else if (/CERAI\s*MATI/i.test(upper)) statusPerkawinan = 'Cerai Mati';
      else if (/KAWIN/i.test(upper)) statusPerkawinan = 'Kawin';
    }

    if (!pekerjaan && /\b(PEKERJAAN)\b/i.test(upper)) {
      const val = stripFieldLabel(line, /^.*?\bPEKERJAAN\b/i)
        .replace(/\bKEWARGANEGARAAN.*$/i, '')
        .replace(/[^a-zA-Z/\s.-]/g, '')
        .trim();
      if (val.length >= 2) {
        pekerjaan = toCleanTitleCase(val);
      }
    }
  }

  // 3. Perkaya & Validasi Silang dengan Dekoder 16-Digit NIK
  const nikInfo = decodeIndonesianNik(nik);
  if (nikInfo.isValidFormat) {
    if (!tanggalLahir && nikInfo.tanggalLahir) {
      tanggalLahir = nikInfo.tanggalLahir;
    }
    if (!jenisKelamin && nikInfo.jenisKelamin) {
      jenisKelamin = nikInfo.jenisKelamin;
    }
    if (!tempatLahir && nikInfo.tempatLahirSuggestion) {
      tempatLahir = nikInfo.tempatLahirSuggestion;
    }
    if (!kabKota && nikInfo.dpdName) {
      kabKota = nikInfo.dpdName;
    }
  }

  const fullAddressParts: string[] = [];
  if (alamat) fullAddressParts.push(alamat);
  if (rtRw) fullAddressParts.push(`RT/RW ${rtRw}`);
  if (kelDesa) fullAddressParts.push(`Kel/Desa ${kelDesa}`);
  if (kecamatan) fullAddressParts.push(`Kec. ${kecamatan}`);
  const alamatLengkap = fullAddressParts.join(', ');

  const territoryMatch = matchSulutTerritoryFromKtp(kabKota, kecamatan, kelDesa, nik);

  let foundFields = 0;
  if (nik.length === 16) foundFields += 35;
  else if (nik.length >= 10) foundFields += 15;
  if (namaLengkap) foundFields += 25;
  if (tanggalLahir) foundFields += 10;
  if (jenisKelamin) foundFields += 10;
  if (alamat || kelDesa || kecamatan) foundFields += 10;
  if (agama || pekerjaan) foundFields += 10;

  return {
    nik,
    namaLengkap,
    tempatLahir,
    tanggalLahir,
    jenisKelamin,
    alamatLengkap,
    rtRw,
    kelDesa,
    kecamatan,
    kabKota,
    agama,
    statusPerkawinan,
    pekerjaan,
    matchedDpd: territoryMatch.matchedDpd,
    matchedDpc: territoryMatch.matchedDpc,
    matchedDprt: territoryMatch.matchedDprt,
    confidence: Math.min(100, foundFields),
    rawText,
  };
}

