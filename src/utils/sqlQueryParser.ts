import { Member } from '../types';
import { TerritoryContext, ParsedTerritoryRow, ParseTerritoryExcelResult } from './territorialExcelTemplateUtils';
import { getStructureTemplate } from '../data/structureTemplates';
import { isJobTitleMatch, normalizeSubOrgName } from './jobMatchingUtils';
import { SULUT_REGIONS } from '../data/sulutRegions';
import { isDpdMatch } from '../utils/structureReadinessUtils';

/**
 * Helper untuk mem-parsing baris tuple SQL seperti:
 * ('KOTAMOBAGU-DPD-001', NULL, 'Hi. Londa Simbala, BA RN.DE', NULL, ..., 'Ketua', ...)
 * Memperhatikan string ber-tanda petik tunggal, petik ganda, escape petik (''), dan koma di dalam teks nama.
 */
function parseSqlTupleValues(tupleStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];

    if ((char === "'" || char === '"') && !inQuote) {
      inQuote = true;
      quoteChar = char;
      continue;
    }

    if (char === quoteChar && inQuote) {
      // Check for escaped quote ('')
      if (i + 1 < tupleStr.length && tupleStr[i + 1] === quoteChar) {
        current += quoteChar;
        i++; // skip next quote
        continue;
      }
      inQuote = false;
      continue;
    }

    if (char === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim() || result.length > 0) {
    result.push(current.trim());
  }

  return result.map((val) => {
    const clean = val.trim();
    if (clean.toUpperCase() === 'NULL') return '';
    return clean;
  });
}

/**
 * Mem-parsing string kueri SQL INSERT INTO public.members ... VALUES (...)
 * menjadi objek Member dan ParsedTerritoryRow yang siap disimpan ke database.
 */
export function parseSqlInsertQuery(
  sqlText: string,
  ctx: TerritoryContext,
  currentMembers: Member[],
  adminName = 'Admin SQL Editor'
): ParseTerritoryExcelResult {
  if (!sqlText || !sqlText.trim()) {
    throw new Error('Kueri SQL masih kosong. Silakan tempel perintah INSERT INTO public.members.');
  }

  // 1. Bersihkan komentar SQL (-- komentar dan /* komentar */)
  let cleaned = sqlText
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/--.*$/gm, ''); // single line comments

  // 2. Ambil blok nama kolom pada INSERT INTO ... (...)
  const insertRegex = /INSERT\s+INTO\s+(?:public\.)?members\s*\(([^)]+)\)\s*VALUES/i;
  const insertMatch = cleaned.match(insertRegex);

  let columnNames: string[] = [];
  let valuesBlock = '';

  if (insertMatch) {
    columnNames = insertMatch[1]
      .split(',')
      .map((col) => col.trim().toLowerCase().replace(/['"`]/g, ''));

    // Ambil teks setelah kata kunci VALUES
    const valuesIdx = cleaned.indexOf(insertMatch[0]) + insertMatch[0].length;
    valuesBlock = cleaned.substring(valuesIdx);
  } else {
    // Cek jika kueri langsung mulai dari VALUES (...)
    const valuesOnlyIdx = cleaned.search(/\bVALUES\b/i);
    if (valuesOnlyIdx !== -1) {
      valuesBlock = cleaned.substring(valuesOnlyIdx + 6);
      // Kolom default standard sesuai skema members
      columnNames = [
        'nik',
        'nomor_ekta',
        'nama_lengkap',
        'nomor_hp',
        'email',
        'sosmed',
        'dpd',
        'dpc',
        'dprt',
        'is_pengurus',
        'tingkat_kepengurusan',
        'wilayah_penugasan',
        'nomor_sk',
        'tanggal_sk',
        'jabatan',
        'status',
        'tanggal_bergabung',
        'catatan_mutasi',
        'diubah_oleh',
      ];
    } else {
      throw new Error(
        'Format kueri SQL tidak dikenali. Pastikan terdapat perintah "INSERT INTO public.members (...) VALUES (...)"'
      );
    }
  }

  // Potong jika ada klausul ON CONFLICT di bagian akhir
  const onConflictIdx = valuesBlock.search(/\bON\s+CONFLICT\b/i);
  if (onConflictIdx !== -1) {
    valuesBlock = valuesBlock.substring(0, onConflictIdx);
  }

  // Hapus titik koma di akhir
  valuesBlock = valuesBlock.replace(/;\s*$/, '').trim();

  // 3. Ekstraksi setiap baris tuple ( ... ) di dalam valuesBlock
  const rawTuples: string[] = [];
  let depth = 0;
  let inString = false;
  let quoteChar = '';
  let tupleStart = -1;

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];

    if ((char === "'" || char === '"') && !inString) {
      inString = true;
      quoteChar = char;
      continue;
    }
    if (char === quoteChar && inString) {
      if (i + 1 < valuesBlock.length && valuesBlock[i + 1] === quoteChar) {
        i++;
        continue;
      }
      inString = false;
      continue;
    }

    if (!inString) {
      if (char === '(') {
        if (depth === 0) {
          tupleStart = i + 1;
        }
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0 && tupleStart !== -1) {
          rawTuples.push(valuesBlock.substring(tupleStart, i));
          tupleStart = -1;
        }
      }
    }
  }

  if (rawTuples.length === 0) {
    throw new Error('Tidak ditemukan baris data tuple (...) di dalam perintah VALUES.');
  }

  // Index kolom pemetaan
  const colNik = columnNames.findIndex((c) => c === 'nik');
  const colEkta = columnNames.findIndex((c) => c === 'nomor_ekta' || c === 'ekta' || c === 'kta');
  const colNama = columnNames.findIndex((c) => c === 'nama_lengkap' || c === 'nama');
  const colHp = columnNames.findIndex((c) => c === 'nomor_hp' || c === 'hp' || c === 'telepon');
  const colEmail = columnNames.findIndex((c) => c === 'email');
  const colSosmed = columnNames.findIndex((c) => c === 'sosmed' || c === 'sosial_media');
  const colDpd = columnNames.findIndex((c) => c === 'dpd');
  const colDpc = columnNames.findIndex((c) => c === 'dpc');
  const colDprt = columnNames.findIndex((c) => c === 'dprt');
  const colIsPengurus = columnNames.findIndex((c) => c === 'is_pengurus');
  const colTingkat = columnNames.findIndex((c) => c === 'tingkat_kepengurusan' || c === 'tingkat');
  const colWilayah = columnNames.findIndex((c) => c === 'wilayah_penugasan' || c === 'wilayah' || c === 'sub_organisasi' || c === 'suborg');
  const colNomorSk = columnNames.findIndex((c) => c === 'nomor_sk' || c === 'sk');
  const colTanggalSk = columnNames.findIndex((c) => c === 'tanggal_sk');
  const colJabatan = columnNames.findIndex((c) => c === 'jabatan' || c === 'posisi');
  const colStatus = columnNames.findIndex((c) => c === 'status');
  const colTanggalBergabung = columnNames.findIndex((c) => c === 'tanggal_bergabung');
  const colCatatanMutasi = columnNames.findIndex((c) => c === 'catatan_mutasi');
  const colDiubahOleh = columnNames.findIndex((c) => c === 'diubah_oleh');

  const slots = getStructureTemplate(ctx.level);
  const parsedRows: ParsedTerritoryRow[] = [];
  const membersToSave: Member[] = [];
  const occupiedNiks = new Set<string>(currentMembers.map((m) => m.nik));

  let filledCount = 0;
  let matchedPositions = 0;
  let customPositions = 0;

  rawTuples.forEach((tupleStr, idx) => {
    const values = parseSqlTupleValues(tupleStr);
    if (values.length === 0) return;

    const rawNik = colNik !== -1 ? values[colNik] || '' : '';
    const rawEkta = colEkta !== -1 ? values[colEkta] || '' : '';
    const rawNama = colNama !== -1 ? values[colNama] || '' : '';
    const rawHp = colHp !== -1 ? values[colHp] || '' : '';
    const rawEmail = colEmail !== -1 ? values[colEmail] || '' : '';
    const rawSosmed = colSosmed !== -1 ? values[colSosmed] || '' : '';
    let rawDpd = colDpd !== -1 ? values[colDpd] || '' : ctx.dpd;
    let rawDpc = colDpc !== -1 ? values[colDpc] || '' : ctx.dpc || 'Wilayah DPD';
    let rawDprt = colDprt !== -1 ? values[colDprt] || '' : ctx.dprt || 'Pusat/Umum';
    const rawTingkat = (colTingkat !== -1 ? values[colTingkat] || '' : ctx.level) as 'DPW' | 'DPD' | 'DPC' | 'DPRt';
    const rawWilayah = colWilayah !== -1 ? values[colWilayah] || '' : '';
    const rawNomorSk = colNomorSk !== -1 ? values[colNomorSk] || '' : '';
    const rawTanggalSk = colTanggalSk !== -1 ? values[colTanggalSk] || '' : '';
    const rawJabatan = colJabatan !== -1 ? values[colJabatan] || '' : '';
    const rawStatus = colStatus !== -1 ? values[colStatus] || 'Aktif' : 'Aktif';
    const rawTanggalBergabung = colTanggalBergabung !== -1 ? values[colTanggalBergabung] || '' : '';
    const rawCatatanMutasi = colCatatanMutasi !== -1 ? values[colCatatanMutasi] || '' : '';

    if (!rawNama && !rawJabatan) return;

    // Deteksi DPD resmi jika disebutkan
    if (rawDpd) {
      const foundReg = SULUT_REGIONS.find((r) => isDpdMatch(r.name, rawDpd));
      if (foundReg) {
        rawDpd = foundReg.name;
      }
    }

    // Normalisasi wilayah penugasan (Dewan Pertimbangan, Dewan Pakar, Dewan Pimpinan)
    const normalizedSubOrg = normalizeSubOrgName(rawWilayah || rawJabatan, rawTingkat || ctx.level);

    // Cari kesesuaian posisi jabatan dengan template resmi
    const matchedSlot = slots.find((s) => isJobTitleMatch(rawJabatan, s.jabatan));
    const isMatched = !!matchedSlot;
    if (isMatched) {
      matchedPositions++;
    } else if (rawJabatan) {
      customPositions++;
    }

    const isFilled = rawNama.trim().length > 0;
    let nikVal = rawNik.trim();

    if (isFilled) {
      filledCount++;

      // Jika NIK kosong atau merupakan placeholder kode contoh (misal: 'KOTAMOBAGU-DPD-001'),
      // pertahankan atau buatkan NIK 16 digit yang unik jika diperlukan
      if (!nikVal) {
        nikVal = `71002026${String(10000000 + idx + 1).slice(-8)}`;
      }

      occupiedNiks.add(nikVal);

      const existingMember = currentMembers.find(
        (m) =>
          m.nik === nikVal ||
          (rawEkta && m.nomorEKTA === rawEkta) ||
          (isDpdMatch(m.dpd, rawDpd) &&
            normalizeSubOrgName(m.wilayahPenugasan, rawTingkat) === normalizedSubOrg &&
            isJobTitleMatch(m.jabatan, rawJabatan))
      );

      const memberObj: Member = {
        ...(existingMember || {}),
        nik: nikVal,
        nomorEKTA: rawEkta || existingMember?.nomorEKTA || nikVal,
        namaLengkap: rawNama,
        email: rawEmail || existingMember?.email || undefined,
        nomorHP: rawHp && rawHp !== '-' ? rawHp : existingMember?.nomorHP || '-',
        sosmed: rawSosmed || existingMember?.sosmed || undefined,
        dpd: rawDpd,
        dpc: rawDpc || 'Wilayah DPD',
        dprt: rawDprt || 'Pusat/Umum',
        isPengurus: true,
        tingkatKepengurusan: rawTingkat || ctx.level,
        wilayahPenugasan: normalizedSubOrg,
        nomorSK: rawNomorSk || existingMember?.nomorSK || undefined,
        tanggalSK: rawTanggalSk || existingMember?.tanggalSK || undefined,
        jabatan: rawJabatan || matchedSlot?.jabatan || 'Pengurus',
        status: (rawStatus as any) || 'Aktif',
        statusKtpVerified: true,
        tanggalBergabung:
          rawTanggalBergabung ||
          existingMember?.tanggalBergabung ||
          new Date().toISOString().substring(0, 10),
        catatanMutasi: rawCatatanMutasi || existingMember?.catatanMutasi || undefined,
        terakhirDiubah: new Date().toISOString().replace('T', ' ').substring(0, 16),
        diubahOleh: `${adminName} (Import SQL Editor)`,
      };

      membersToSave.push(memberObj);
    }

    parsedRows.push({
      no: idx + 1,
      dpd: rawDpd,
      subOrg: normalizedSubOrg,
      jabatanExcel: rawJabatan || 'Pengurus',
      jabatanMatched: matchedSlot?.jabatan,
      isMatched,
      namaLengkap: rawNama,
      nik: nikVal,
      nomorEKTA: rawEkta,
      jenisKelamin: '',
      nomorHP: rawHp,
      email: rawEmail,
      alamat: '',
      status: rawStatus,
      isFilled,
    });
  });

  if (parsedRows.length === 0) {
    throw new Error('Tidak ada baris pengurus yang berhasil diekstrak dari kueri SQL tersebut.');
  }

  return {
    territoryContext: ctx,
    rows: parsedRows,
    membersToSave,
    stats: {
      totalRows: parsedRows.length,
      filledRows: filledCount,
      emptyRows: parsedRows.length - filledCount,
      matchedPositions,
      customPositions,
    },
    filename: `Import_SQL_Editor_${new Date().toISOString().substring(0, 10)}.sql`,
  };
}
