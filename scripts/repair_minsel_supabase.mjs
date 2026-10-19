import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

// 36 posisi resmi DPD
const dpdPositions = [
  "Ketua",
  "Wakil Ketua Bidang Pemenangan Pemilu",
  "Wakil Ketua Bidang Organisasi dan Keanggotaan",
  "Wakil Ketua Bidang Kaderisasi dan Pendidikan Politik",
  "Wakil Ketua Bidang Hubungan Legislatif",
  "Wakil Ketua Bidang Hubungan Eksekutif",
  "Wakil Ketua Bidang Hubungan Sayap dan Badan",
  "Wakil Ketua Bidang Penggalangan dan Penggerak Komunitas",
  "Wakil Ketua Bidang Pemilih Pemula dan Milenial",
  "Wakil Ketua Bidang Digital dan Siber",
  "Wakil Ketua Bidang Media dan Komunikasi Publik",
  "Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah (UMKM)",
  "Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah",
  "Wakil Ketua Bidang Agama dan Masyarakat Adat",
  "Wakil Ketua Bidang Tenaga Kerja",
  "Wakil Ketua Bidang Kesehatan",
  "Wakil Ketua Bidang Perempuan dan Anak",
  "Wakil Ketua Bidang Pendidikan dan Kebudayaan",
  "Wakil Ketua Bidang Hukum dan Hak Asasi Manusia",
  "Wakil Ketua Bidang Pariwisata dan Industri Kreatif",
  "Wakil Ketua Bidang Pertanian, Peternakan dan Kemandirian Desa",
  "Wakil Ketua Bidang Maritim",
  "Wakil Ketua Bidang Pemuda dan Olahraga",
  "Wakil Ketua Bidang Energi dan Mineral",
  "Wakil Ketua Bidang Lingkungan Hidup",
  "Wakil Ketua Bidang Kehutanan, Agraria dan Tata Ruang",
  "Wakil Ketua Bidang Migran",
  "Wakil Ketua Bidang Pembangunan dan Infrastruktur",
  "Sekretaris",
  "Wakil Sekretaris Bidang Kebijakan Publik dan Isu Strategis",
  "Wakil Sekretaris Bidang Ideologi, Organisasi dan Kaderisasi",
  "Wakil Sekretaris Bidang Pemenangan Pemilu",
  "Wakil Sekretaris Bidang Umum dan Administrasi",
  "Bendahara",
  "Wakil Bendahara Pengelolaan Dana dan Aset",
  "Wakil Bendahara Penggalangan Dana"
];

const updates = [
  // I. DEWAN PERTIMBANGAN
  {
    nik: '7106112026000001',
    nama: 'Deren Paulorino',
    subOrg: 'I. DEWAN PERTIMBANGAN',
    jabatan: 'Ketua'
  },
  {
    nik: '7106112026000002',
    nama: 'Harvey Tewal',
    subOrg: 'I. DEWAN PERTIMBANGAN',
    jabatan: 'Sekretaris'
  },

  // II. DEWAN PAKAR
  {
    nik: '7106112026000003',
    nama: 'Jackson Iqbal De Hesselle',
    subOrg: 'II. DEWAN PAKAR',
    jabatan: 'Ketua'
  },
  {
    nik: '7106112026000004',
    nama: 'Yanli Kumajas',
    subOrg: 'II. DEWAN PAKAR',
    jabatan: 'Sekretaris'
  },

  // III. DEWAN PIMPINAN DAERAH (36 Kader)
  {
    nik: '7106112026000005',
    nama: 'Paulman Stevanus Runtuwene, ST.MBA',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Ketua'
  },
  {
    nik: '7106112026000006',
    nama: 'Welly Citra Repi',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pemenangan Pemilu'
  },
  {
    nik: '7106112026000007',
    nama: 'Novita Violeta Maramis, S.Ak',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Organisasi dan Keanggotaan'
  },
  {
    nik: '7106112026000008',
    nama: 'Kumaat Alex',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Kaderisasi dan Pendidikan Politik'
  },
  {
    nik: '7106112026000009',
    nama: 'Audie Pojoh',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Hubungan Legislatif'
  },
  {
    nik: '7106112026000010',
    nama: 'Freyke Ibrahim',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Hubungan Eksekutif'
  },
  {
    nik: '7106112026000011',
    nama: 'Ruldio H.V Kondoj',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Hubungan Sayap dan Badan'
  },
  {
    nik: '7106112026000012',
    nama: 'Servie A.M Lasut, SH',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Penggalangan dan Penggerak Komunitas'
  },
  {
    nik: '7106112026000013',
    nama: 'Andrew willy Mononimbar',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pemilih Pemula dan Milenial'
  },
  {
    nik: '7106112026000014',
    nama: 'Suhardi Tani',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Digital dan Siber'
  },
  {
    nik: '7106112026000015',
    nama: 'Temmy Vino Runtuwene',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Media dan Komunikasi Publik'
  },
  {
    nik: '7106112026000016',
    nama: 'Santje Rajak',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah (UMKM)'
  },
  {
    nik: '7106112026000017',
    nama: 'Mien Maloringan',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Usaha Mikro Kecil dan Menengah'
  },
  {
    nik: '7106112026000018',
    nama: 'Mursid Bakar',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Agama dan Masyarakat Adat'
  },
  {
    nik: '7106112026000019',
    nama: 'Djemmy Pontolaeng',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Tenaga Kerja'
  },
  {
    nik: '7106112026000020',
    nama: 'Seyfi Sarayar',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Kesehatan'
  },
  {
    nik: '7106112026000021',
    nama: 'Sandra Selvi Umpel',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Perempuan dan Anak'
  },
  {
    nik: '7106112026000022',
    nama: 'Yan Kumayas',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pendidikan dan Kebudayaan'
  },
  {
    nik: '7106112026000023',
    nama: 'Marcella Talumepa',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Hukum dan Hak Asasi Manusia'
  },
  {
    nik: '7106112026000024',
    nama: 'Suparti Suharjo',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pariwisata dan Industri Kreatif'
  },
  {
    nik: '7106112026000025',
    nama: 'Jeane Bujung',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pertanian, Peternakan dan Kemandirian Desa'
  },
  {
    nik: '7106112026000026',
    nama: 'Mihdad Ansar',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Maritim'
  },
  {
    nik: '7106112026000027',
    nama: 'Meckry Lumintang',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pemuda dan Olahraga'
  },
  {
    nik: '7106112026000028',
    nama: 'Yanto Lintjewas',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Energi dan Mineral'
  },
  {
    nik: '7106112026000029',
    nama: 'Joins Franky Rorimpandey',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Lingkungan Hidup'
  },
  {
    nik: '7106112026000030',
    nama: 'Jaclien Rumengan',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Kehutanan, Agraria dan Tata Ruang'
  },
  {
    nik: '7106112026000031',
    nama: 'Marthen Josofh Richard Barens',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Migran'
  },
  {
    nik: '7106112026000032',
    nama: 'Aryanto Yatman',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Ketua Bidang Pembangunan dan Infrastruktur'
  },
  {
    nik: '7106112026000033',
    nama: 'Olsen Egeten, SH',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Sekretaris'
  },
  {
    nik: '7106112026000034',
    nama: 'Anggita Tuela',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Sekretaris Bidang Kebijakan Publik dan Isu Strategis'
  },
  {
    nik: '7106112026000035',
    nama: 'Jonli Alfi Pasiowan',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Sekretaris Bidang Ideologi, Organisasi dan Kaderisasi'
  },
  {
    nik: '7106112026000036',
    nama: 'Fita Kauntul',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Sekretaris Bidang Pemenangan Pemilu'
  },
  {
    nik: '7106112026000037',
    nama: 'Maykel Tentero',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Sekretaris Bidang Umum dan Administrasi'
  },
  {
    nik: '7106332026000038',
    nama: 'Lady Monalisa Indah Langie, SE',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Bendahara'
  },
  {
    nik: '7106332026000039',
    nama: 'Marietje S. N Tuela',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Bendahara Pengelolaan Dana dan Aset'
  },
  {
    nik: '7106332026000040',
    nama: 'Anjeli Tutu',
    subOrg: 'III. DEWAN PIMPINAN DAERAH',
    jabatan: 'Wakil Bendahara Penggalangan Dana'
  }
];

async function repair() {
  console.log(`Mulai memperbarui ${updates.length} data pengurus Minahasa Selatan di Supabase...`);
  
  for (const item of updates) {
    const { data, error } = await supabase
      .from('members')
      .update({
        jabatan: item.jabatan,
        wilayah_penugasan: item.subOrg,
        terakhir_diubah: new Date().toISOString()
      })
      .eq('nik', item.nik);

    if (error) {
      console.error(`Gagal mengupdate NIK ${item.nik} (${item.nama}):`, error.message);
    } else {
      console.log(`Berhasil update: [${item.subOrg}] ${item.jabatan} -> ${item.nama}`);
    }
  }
  console.log('Semua data pengurus Minsel telah berhasil direparasi di Supabase!');
}

repair();
