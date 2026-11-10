import {
  decodeIndonesianNik,
  matchSulutTerritoryFromKtp,
  stringSimilarity,
  SULUT_NIK_PREFIX_TO_DPD,
} from './nikDecoder';

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

const STANDARD_KTP_PEKERJAAN = [
  'Belum/Tidak Bekerja',
  'Mengurus Rumah Tangga',
  'Pelajar/Mahasiswa',
  'Pensiunan',
  'Pegawai Negeri Sipil',
  'TNI',
  'Kepolisian RI',
  'Perdagangan',
  'Petani/Pekebun',
  'Peternak',
  'Nelayan/Perikanan',
  'Industri',
  'Konstruksi',
  'Transportasi',
  'Karyawan Swasta',
  'Karyawan BUMN',
  'Karyawan BUMD',
  'Karyawan Honorer',
  'Buruh Harian Lepas',
  'Buruh Tani/Perkebunan',
  'Buruh Nelayan/Perikanan',
  'Buruh Peternakan',
  'Pembantu Rumah Tangga',
  'Tukang Cukur',
  'Tukang Listrik',
  'Tukang Batu',
  'Tukang Kayu',
  'Tukang Las/Pandai Besi',
  'Tukang Jahit',
  'Mekanik',
  'Seniman',
  'Pendeta',
  'Pastor',
  'Wartawan',
  'Ustadz/Mubaligh',
  'Juru Masak',
  'Dosen',
  'Guru',
  'Pengacara',
  'Notaris',
  'Arsitek',
  'Akuntan',
  'Konsultan',
  'Dokter',
  'Bidan',
  'Perawat',
  'Apoteker',
  'Pelaut',
  'Peneliti',
  'Sopir',
  'Perangkat Desa',
  'Kepala Desa',
  'Wiraswasta',
  'Wirausaha',
  'Pedagang',
];

export function normalizeOcrDigits(str: string): string {
  return (str || '')
    .replace(/[OoQDCU]/g, '0')
    .replace(/[Il|!Lij]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[E]/g, '3')
    .replace(/[A]/g, '4')
    .replace(/[Ss$]/g, '5')
    .replace(/[Ggb]/g, '6')
    .replace(/[T?J]/g, '7')
    .replace(/[B&]/g, '8')
    .replace(/[gqp]/g, '9');
}

function stripFieldLabel(line: string, labelPattern: RegExp): string {
  return line
    .replace(labelPattern, '')
    .replace(/^[\s:;.\-=_/\\|]+/, '')
    .replace(/[\s:;.\-=_/\\|]+$/, '')
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

function matchBestStandardPekerjaan(rawVal: string): string {
  const cleaned = (rawVal || '')
    .replace(/\b(KEWARGANEGARAAN|WNI|BERLAKU|SEUMUR|HIDUP|GOL|DARAH)\b.*$/i, '')
    .replace(/[^a-zA-Z/\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 2) return '';

  const upper = cleaned.toUpperCase();
  if (/PNS|PEGAWAI\s*NEGERI/i.test(upper)) return 'Pegawai Negeri Sipil';
  if (/RUMAH\s*TANGGA|IRT|MENGURUS/i.test(upper)) return 'Mengurus Rumah Tangga';
  if (/PELAJAR|MAHASISWA/i.test(upper)) return 'Pelajar/Mahasiswa';
  if (/BELUM.*BEKERJA|TIDAK.*BEKERJA/i.test(upper)) return 'Belum/Tidak Bekerja';
  if (/WIRASWASTA/i.test(upper)) return 'Wiraswasta';
  if (/WIRAUSAHA/i.test(upper)) return 'Wirausaha';
  if (/SWASTA/i.test(upper)) return 'Karyawan Swasta';
  if (/PETANI|PEKEBUN/i.test(upper)) return 'Petani/Pekebun';
  if (/NELAYAN/i.test(upper)) return 'Nelayan/Perikanan';
  if (/HONORER/i.test(upper)) return 'Karyawan Honorer';
  if (/BURUH.*HARIAN/i.test(upper)) return 'Buruh Harian Lepas';

  let bestMatch = '';
  let bestScore = 0;
  for (const job of STANDARD_KTP_PEKERJAAN) {
    const score = stringSimilarity(cleaned, job);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = job;
    }
  }

  if (bestScore >= 0.65) {
    return bestMatch;
  }
  return toCleanTitleCase(cleaned);
}

export function extractBestNikFromText(rawText: string): string {
  const lines = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates: string[] = [];

  for (const line of lines) {
    const stripped = line.replace(/\b(NIK|N1K|HIK|MIK|KTP)\b/gi, ' ');
    const norm = normalizeOcrDigits(stripped);
    const matches = norm.match(/\d[\d\s]{13,20}\d/g) || [];
    for (const m of matches) {
      const digits = m.replace(/\D/g, '');
      if (digits.length >= 16) {
        candidates.push(digits.slice(0, 16));
      } else if (digits.length >= 14) {
        candidates.push(digits);
      }
    }
  }

  const fullNorm = normalizeOcrDigits(rawText);
  const direct16 = fullNorm.match(/\d{16}/g) || [];
  candidates.push(...direct16);

  if (candidates.length === 0) return '';

  const healedCandidates = candidates.map((cand) => {
    if (cand.length === 16 && !cand.startsWith('71')) {
      const possibleSulutPrefix = `71${cand.slice(2, 4)}`;
      if (
        SULUT_NIK_PREFIX_TO_DPD[possibleSulutPrefix] &&
        (cand[0] === '1' || cand[0] === '7' || cand[1] === '1' || cand[1] === '7')
      ) {
        return `71${cand.slice(2)}`;
      }
    }
    return cand;
  });

  let bestNik = healedCandidates[0];
  let bestScore = -1;

  for (const cand of healedCandidates) {
    let score = 0;
    if (cand.length === 16) score += 50;
    if (cand.startsWith('71')) score += 25;
    if (SULUT_NIK_PREFIX_TO_DPD[cand.slice(0, 4)]) score += 30;
    const decoded = decodeIndonesianNik(cand);
    if (decoded.isValidFormat) score += 40;

    if (score > bestScore) {
      bestScore = score;
      bestNik = cand;
    }
  }

  return bestNik.slice(0, 16);
}

function cleanPersonName(raw: string): string {
  return (raw || '')
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/4/g, 'A')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B')
    .replace(/\b(PROVINSI|KABUPATEN|KOTA|NIK|NAMA|TEMPAT|LAHIR|JENIS|KELAMIN)\b/gi, '')
    .replace(/[^a-zA-Z\s.,']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export function parseKtpOcrText(rawText: string, dedicatedNikText?: string): ExtractedKtpData {
  const combinedForNik = dedicatedNikText ? `${dedicatedNikText}\n${rawText}` : rawText;
  const nik = extractBestNikFromText(combinedForNik);

  const lines = (rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

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

  let nikLineIdx = -1;
  let ttlLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    if (nikLineIdx === -1 && (/\b(NIK|N1K|HIK)\b/i.test(upper) || (nik && line.includes(nik.slice(0, 8))))) {
      nikLineIdx = i;
    }

    if (!kabKota && /\b(KABUPATEN|KOTA|KAB\.)\b/i.test(upper) && !/PROVINSI/i.test(upper)) {
      const kabMatch = upper.match(/\b(KABUPATEN|KOTA)\s+[A-Z\s]+/);
      if (kabMatch) {
        kabKota = toCleanTitleCase(kabMatch[0]);
      }
    }

    if (
      !namaLengkap &&
      /\b(NAMA|NANA|MAMA|HAMA|NAM4|NAWA)\b/i.test(upper) &&
      !/AGAMA|KECAMATAN|KEWARGANEGARAAN/i.test(upper)
    ) {
      let val = stripFieldLabel(line, /^.*?\b(NAMA|NANA|MAMA|HAMA|NAM4|NAWA)\b/i);
      if (val.length < 2 && i + 1 < lines.length && !/TEMPAT|TGL|LAHIR|KELAMIN/i.test(lines[i + 1])) {
        val = lines[i + 1];
      }
      const cleaned = cleanPersonName(val);
      if (cleaned.length >= 2) {
        namaLengkap = cleaned;
      }
    }

    const hasTtlLabel = /\b(TEMPAT|TEMPAL|TMP|TGL|TGI|LAHIR|LAHL|TTL)\b/i.test(upper);
    const normDateLine = normalizeOcrDigits(line);
    const dateRegex = /(\d{2})\s*[-/.,\s]\s*(\d{2})\s*[-/.,\s]\s*((?:19|20)\d{2})/;
    const dateMatch = normDateLine.match(dateRegex);

    if ((!tempatLahir || !tanggalLahir) && (hasTtlLabel || dateMatch)) {
      ttlLineIdx = i;
      const val = hasTtlLabel
        ? stripFieldLabel(
            line,
            /^.*?\b(LAHIR|LAHL|TGL\s*LAHIR|TGI\s*LAHIR|TEMPAT\s*\/?\s*TGL\s*LAHIR|TEMPAT|TTL)\b/i
          )
        : line;
      const valDateMatch = normalizeOcrDigits(val).match(dateRegex);
      if (valDateMatch) {
        const [, d, m, y] = valDateMatch;
        const ddNum = parseInt(d, 10);
        const mmNum = parseInt(m, 10);
        if (ddNum >= 1 && ddNum <= 31 && mmNum >= 1 && mmNum <= 12) {
          tanggalLahir = `${y}-${m}-${d}`;
        }
        const beforeDate = val
          .slice(0, valDateMatch.index)
          .replace(/^.*?\b(LAHIR|TGL|TEMPAT)\b[:\s]*/i, '')
          .replace(/0/g, 'O')
          .replace(/1/g, 'I')
          .replace(/[^a-zA-Z\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (beforeDate.length >= 2) {
          tempatLahir = toCleanTitleCase(beforeDate);
        }
      } else if (hasTtlLabel) {
        const parts = val.split(/[,:]/);
        const candidatePlace = (parts[0] || '')
          .replace(/0/g, 'O')
          .replace(/1/g, 'I')
          .replace(/[^a-zA-Z\s]/g, '')
          .trim();
        if (candidatePlace.length >= 2) {
          tempatLahir = toCleanTitleCase(candidatePlace);
        }
      }
    }

    if (
      !jenisKelamin &&
      /\b(JENIS\s*KELAMIN|KELAMIN|KELAM1N|LAKI|PEREMPUAN|PERENPUAN|WANITA|PRIA)\b/i.test(upper)
    ) {
      if (/PEREMPUAN|PERENPUAN|WANITA/i.test(upper)) {
        jenisKelamin = 'Perempuan';
      } else if (/LAKI|PRIA/i.test(upper)) {
        jenisKelamin = 'Laki-laki';
      }
    }

    if (!alamat && /\b(ALAMAT|ALANAT|ALAMAL|ALA\s*MAT)\b/i.test(upper)) {
      const val = stripFieldLabel(line, /^.*?\b(ALAMAT|ALANAT|ALAMAL|ALA\s*MAT)\b/i)
        .replace(/\bGOL\.?\s*DARAH.*$/i, '')
        .replace(/^[:\s.-]+/, '')
        .trim();
      if (val.length >= 2) {
        alamat = toCleanTitleCase(val);
      }
    }

    if (!rtRw && (/\b(RT\s*\/?\s*RW|RTRW|RTIRW|RT\s+RW)\b/i.test(upper) || /\b00\d\s*[/|-]\s*00\d\b/.test(normDateLine))) {
      const rtMatch = normDateLine.match(/(\d{1,3})\s*[/|-]\s*(\d{1,3})/);
      if (rtMatch) {
        rtRw = `${rtMatch[1].padStart(3, '0')}/${rtMatch[2].padStart(3, '0')}`;
      }
    }

    if (!kelDesa && /\b(KEL\s*\/?\s*DESA|KEI\s*\/?\s*DESA|KEL\s*\/?\s*DOSA|KELURAHAN|DESA|KEVDESA)\b/i.test(upper)) {
      const val = stripFieldLabel(
        line,
        /^.*?\b(KEL\s*\/?\s*DESA|KEI\s*\/?\s*DESA|KEL\s*\/?\s*DOSA|KELURAHAN|DESA|KEVDESA)\b/i
      )
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (val.length >= 2) {
        kelDesa = toCleanTitleCase(val);
      }
    }

    if (!kecamatan && /\b(KECAMATAN|KECANATAN|KECAMALAN|KECA\s*MATAN|KEC\.)\b/i.test(upper)) {
      const val = stripFieldLabel(
        line,
        /^.*?\b(KECAMATAN|KECANATAN|KECAMALAN|KECA\s*MATAN|KEC\.)\b/i
      )
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (val.length >= 2) {
        kecamatan = toCleanTitleCase(val);
      }
    }

    if (
      !agama &&
      /\b(AGAMA|AGANA|AQAMA|ISLAM|1SLAM|KRISTEN|KR1STEN|PROTESTAN|KATOLIK|KATHOLIK|HINDU|BUDDHA|BUDHA|KHONGHUCU|KONGHUCU)\b/i.test(
        upper
      )
    ) {
      if (/KRISTEN|KR1STEN|PROTESTAN/i.test(upper)) agama = 'Kristen Protestan';
      else if (/KATOLIK|KATHOLIK/i.test(upper)) agama = 'Katolik';
      else if (/ISLAM|1SLAM|ISLAN/i.test(upper)) agama = 'Islam';
      else if (/HINDU/i.test(upper)) agama = 'Hindu';
      else if (/BUDDHA|BUDHA/i.test(upper)) agama = 'Buddha';
      else if (/KHONGHUCU|KONGHUCU/i.test(upper)) agama = 'Khonghucu';
    }

    if (!statusPerkawinan && /\b(PERKAWINAN|PERKAW1NAN|KAWIN|KAW1N|CERAI)\b/i.test(upper)) {
      if (/BELUM|BLN/i.test(upper)) statusPerkawinan = 'Belum Kawin';
      else if (/CERAI\s*HIDUP/i.test(upper)) statusPerkawinan = 'Cerai Hidup';
      else if (/CERAI\s*MATI/i.test(upper)) statusPerkawinan = 'Cerai Mati';
      else if (/KAWIN|KAW1N/i.test(upper)) statusPerkawinan = 'Kawin';
    }

    if (!pekerjaan && /\b(PEKERJAAN|PEKERIAAN|PEKERLAAN|PEKERJ4AN)\b/i.test(upper)) {
      const val = stripFieldLabel(line, /^.*?\b(PEKERJAAN|PEKERIAAN|PEKERLAAN|PEKERJ4AN)\b/i);
      const matchedJob = matchBestStandardPekerjaan(val);
      if (matchedJob) {
        pekerjaan = matchedJob;
      }
    }
  }

  if (!namaLengkap) {
    const candidateIdx =
      ttlLineIdx > 0 ? ttlLineIdx - 1 : nikLineIdx >= 0 && nikLineIdx + 1 < lines.length ? nikLineIdx + 1 : -1;
    if (candidateIdx >= 0) {
      const rawCandidate = lines[candidateIdx].includes(':')
        ? lines[candidateIdx].split(':').slice(1).join(' ')
        : lines[candidateIdx];
      const cleaned = cleanPersonName(rawCandidate);
      if (cleaned.length >= 3 && !/\d{4,}/.test(rawCandidate)) {
        namaLengkap = cleaned;
      }
    }
  }

  if (!pekerjaan) {
    for (const line of lines) {
      if (/\b(WIRASWASTA|KARYAWAN\s*SWASTA|MENGURUS\s*RUMAH\s*TANGGA|PELAJAR|MAHASISWA|PEGAWAI\s*NEGERI|PETANI|PEKEBUN|NELAYAN|BELUM\s*\/?\s*TIDAK\s*BEKERJA|PENSIUNAN)\b/i.test(line)) {
        pekerjaan = matchBestStandardPekerjaan(line);
        if (pekerjaan) break;
      }
    }
  }

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

  const territoryMatch = matchSulutTerritoryFromKtp(kabKota, kecamatan, kelDesa, nik);
  if (territoryMatch.matchedDpc) {
    kecamatan = territoryMatch.matchedDpc;
  }
  if (territoryMatch.matchedDprt) {
    kelDesa = territoryMatch.matchedDprt;
  }
  if (territoryMatch.matchedDpd && !kabKota) {
    kabKota = territoryMatch.matchedDpd;
  }

  const fullAddressParts: string[] = [];
  if (alamat) fullAddressParts.push(alamat);
  if (rtRw) fullAddressParts.push(`RT/RW ${rtRw}`);
  if (kelDesa) fullAddressParts.push(`Kel/Desa ${kelDesa}`);
  if (kecamatan) fullAddressParts.push(`Kec. ${kecamatan}`);
  const alamatLengkap = fullAddressParts.join(', ');

  let foundFields = 0;
  if (nik.length === 16) foundFields += 35;
  else if (nik.length >= 12) foundFields += 15;
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

export function mergeExtractedKtpData(
  primary: ExtractedKtpData,
  secondary: ExtractedKtpData
): ExtractedKtpData {
  const bestNik =
    primary.nik.length === 16
      ? primary.nik
      : secondary.nik.length === 16
      ? secondary.nik
      : primary.nik.length >= secondary.nik.length
      ? primary.nik
      : secondary.nik;

  const namaLengkap = primary.namaLengkap || secondary.namaLengkap;
  const tempatLahir = primary.tempatLahir || secondary.tempatLahir;
  const tanggalLahir = primary.tanggalLahir || secondary.tanggalLahir;
  const jenisKelamin = primary.jenisKelamin || secondary.jenisKelamin;
  const rtRw = primary.rtRw || secondary.rtRw;
  const kelDesa = primary.kelDesa || secondary.kelDesa;
  const kecamatan = primary.kecamatan || secondary.kecamatan;
  const kabKota = primary.kabKota || secondary.kabKota;
  const agama = primary.agama || secondary.agama;
  const statusPerkawinan = primary.statusPerkawinan || secondary.statusPerkawinan;
  const pekerjaan = primary.pekerjaan || secondary.pekerjaan;
  const matchedDpd = primary.matchedDpd || secondary.matchedDpd;
  const matchedDpc = primary.matchedDpc || secondary.matchedDpc;
  const matchedDprt = primary.matchedDprt || secondary.matchedDprt;

  const alamatLengkap =
    primary.alamatLengkap.length >= secondary.alamatLengkap.length
      ? primary.alamatLengkap
      : secondary.alamatLengkap;

  let confidence = 0;
  if (bestNik.length === 16) confidence += 35;
  if (namaLengkap) confidence += 25;
  if (tanggalLahir) confidence += 10;
  if (jenisKelamin) confidence += 10;
  if (alamatLengkap || kelDesa || kecamatan) confidence += 10;
  if (agama || pekerjaan) confidence += 10;

  return {
    nik: bestNik,
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
    matchedDpd,
    matchedDpc,
    matchedDprt,
    confidence: Math.min(100, confidence),
    rawText: `${primary.rawText}\n${secondary.rawText}`.trim(),
    croppedFaceDataUrl: primary.croppedFaceDataUrl || secondary.croppedFaceDataUrl,
  };
}

