const fs = require('fs');
const path = require('path');

const records = JSON.parse(fs.readFileSync(path.join(__dirname, 'minsel_pengurus_data.json'), 'utf8'));

// Format to Member TypeScript interface
const members = records.map((r, idx) => {
  return {
    nik: r.nik,
    nomorEKTA: r.nomor_ekta || '',
    namaLengkap: r.nama_lengkap,
    nomorHP: r.nomor_hp || '-',
    email: r.email || undefined,
    sosmed: r.sosmed || undefined,
    dpd: r.dpd,
    dpc: r.dpc,
    dprt: r.dprt,
    isPengurus: true,
    tingkatKepengurusan: r.tingkat_kepengurusan,
    wilayahPenugasan: r.wilayah_penugasan,
    nomorSK: r.nomor_sk,
    tanggalSK: r.tanggal_sk,
    jabatan: r.jabatan,
    status: 'Aktif',
    tanggalBergabung: r.tanggal_bergabung,
    catatanMutasi: r.catatan_mutasi,
    diubahOleh: r.diubah_oleh,
  };
});

const tsContent = `import { Member } from '../types';

/**
 * INITIAL_MEMBERS: Data Riil Pengurus DPD & DPC Kabupaten Minahasa Selatan
 * Berdasarkan berkas resmi DPW Partai NasDem Sulawesi Utara.
 * Total: ${members.length} Pengurus ber-SK resmi di 17 Kecamatan.
 */
export const INITIAL_MEMBERS: Member[] = ${JSON.stringify(members, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'seedMembers.ts'), tsContent);
console.log('Updated src/data/seedMembers.ts with ' + members.length + ' real members!');
