# LAPORAN ANALISIS ARSITEKTUR, HAK AKSES (RBAC), DAN PORTAL PENGURUS BER-SK
**Sistem Shadow Database & Monitoring e-KTA DPW Partai NasDem Sulawesi Utara**  
*Tanggal: 13 Oktober 2026*  
*Dokumen Referensi Resmi Pengembangan Sistem*

---

## 1. PENDAHULUAN & LATAR BELAKANG
Sistem ini dirancang sebagai sistem basis data mandiri (*shadow database*) untuk Dewan Pimpinan Wilayah (DPW) Partai NasDem Sulawesi Utara. Tujuannya adalah memetakan kekuatan kader riil di lapangan, mengontrol legalitas kepengurusan ber-SK dari tingkat DPW hingga basis DPRt, serta menjaga integritas data melalui pembatasan akses (*Role-Based Access Control / RBAC*) yang ketat dan bertingkat.

Prinsip fundamental dari sistem ini meliputi:
1. **Basis Alamat Riil KTP:** Semua anggota/kader terdaftar secara rapi pada basis wilayah kelurahan/desa (DPRt) sesuai KTP, terlepas dari tingkatan jabatan kepengurusan yang diembannya (DPW, DPD, DPC, atau DPRt).
2. **Kedaulatan Otoritas DPW:** Super Admin DPW memegang hak penuh dalam persetujuan penghapusan data, audit global, sinkronisasi ID, dan visibilitas 15 Kabupaten/Kota.
3. **Pengamanan Data Daerah:** Admin daerah (DPD, DPC, DPRt) diisolasi hanya pada wilayah teritorialnya masing-masing.
4. **Gerakan Rekrutmen Berbasis SK:** Penambahan anggota baru hanya dapat dilakukan oleh Pengurus yang telah resmi mengantongi Surat Keputusan (SK) Partai NasDem.

---

## 2. MATRIKS HAK AKSES PENGGUNA (ROLE PERMISSION MATRIX)

Berikut adalah pembagian wewenang resmi antar tingkatan peran dalam sistem:

| Fitur & Wewenang | Super Admin (DPW) | Admin DPD (Kab/Kota) | Admin DPC (Kecamatan) | Admin DPRt (Desa/Kel) | Pengurus Ber-SK | Kader Biasa (Non-SK) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Pantau Dashboard 15 Kab/Kota** | ✅ Penuh | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pantau Dashboard Wilayah Sendiri** | ✅ | ✅ (DPD) | ✅ (DPC) | ✅ (DPRt) | ❌ | ❌ |
| **Lihat & Kelola Data Kader** | ✅ 15 Kab/Kota | ✅ Se-Kab/Kota | ✅ Se-Kecamatan | ✅ Se-Kel/Desa | ❌ (Hanya rekrutannya) | ❌ |
| **Tambah Anggota Baru** | ✅ | ✅ | ✅ | ✅ | ✅ *(Wajib SK)* | ❌ *(Terkunci)* |
| **Edit Profil & Cetak e-KTA** | ✅ Bebas | ✅ Wilayahnya | ✅ Wilayahnya | ✅ Wilayahnya | ✅ Milik Sendiri | ✅ Milik Sendiri |
| **Pengajuan Hapus (Soft-Delete)** | ✅ Langsung | ✅ Ajukan ke DPW | ✅ Ajukan ke DPW | ✅ Ajukan ke DPW | ❌ | ❌ |
| **Persetujuan Hapus (Approval/Tolak)**| ✅ Penuh | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sinkronisasi ID & Import Massal** | ✅ Penuh | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Log Riwayat Audit & Filter Mutasi** | ✅ Global | ✅ Wilayahnya | ✅ Wilayahnya | ✅ Wilayahnya | ❌ | ❌ |
| **Cetak Laporan PDF Atasan** | ✅ Lengkap | ✅ Wilayahnya | ✅ Wilayahnya | ✅ Wilayahnya | ❌ | ❌ |

---

## 3. STRUKTUR NAVIGASI BILAH ATAS (NAVBAR) PER TINGKATAN PERAN

Untuk memastikan pengalaman pengguna yang bersih dan aman, tampilan navigasi disesuaikan secara dinamis berdasarkan sesi akun:

### A. Tampilan Navbar Super Admin (DPW Sulut):
1. **Dashboard:** Analisis eksekutif 15 Kab/Kota, kekuatan riil lapangan, tingkat keaktifan, dan status legalitas SK.
2. **Basis Data Kader:** Tabel induk seluruh anggota partai se-Sulawesi Utara.
3. **Import Massal:** Fitur unggah berkas Excel berkapasitas besar.
4. **Sinkronisasi ID:** Validasi keselarasan format NIK dan nomor e-KTA wilayah.
5. **Riwayat Audit:** Panel log audit mutasi lengkap dengan 6 instrumen filter.
6. **Permohonan Hapus (*Approval*):** Lencana notifikasi permohonan dari DPD/DPC untuk diverifikasi Super Admin.
7. **Cetak Laporan PDF:** Generator laporan resmi berkop surat DPW.

### B. Tampilan Navbar Admin Daerah (DPD / DPC / DPRt):
1. **Dashboard Wilayah:** Statistik khusus teritorialnya (contoh: DPD Minahasa Selatan, DPC Amurang, atau DPRt Buyungon).
2. **Kader Daerah:** Tabel anggota yang terfilter otomatis hanya pada batas teritorialnya.
3. **Riwayat Audit Wilayah:** Rekam jejak mutasi yang terjadi di wilayah kerjanya.
4. **Status Pengajuan Hapus:** Panel pemantauan status permohonan penghapusan (Pending, Disetujui, atau Ditolak DPW).
5. **Laporan PDF Atasan:** Dokumen cetak hierarkis untuk diserahkan ke jenjang kepengurusan di atasnya.

---

## 4. ATURAN INTEGRITAS WILAYAH & BASIS ALAMAT KTP

Prinsip pengelolaan alamat anggota dalam basis data:
- **Sinkronisasi Otomatis:** Ketika anggota mendaftar atau diperbarui, alamat KTP secara otomatis menempatkan kader ke DPRt (Desa/Kelurahan), DPC (Kecamatan), dan DPD (Kabupaten/Kota) yang bersangkutan.
- **Pemisahan Alamat KTP vs Penugasan Jabatan:** 
  - Contoh: Seorang kader memiliki KTP di *Desa Buyungon, Kec. Amurang, Kab. Minahasa Selatan*. Dalam struktur teritorial basis, ia tetap terdata di DPRt Buyungon.
  - Namun, jika ia menjabat sebagai **Wakil Ketua Bidang Pemenangan Pemilu di DPW Sulut**, sistem menampilkan badge jabatan tingkat **DPW** pada profilnya, tanpa merusak susunan hierarki teritorial basis KTP-nya.
  - Hal ini menjawab pertanyaan strategis pimpinan: *"Siapa saja kader kita di tingkat desa, dan siapa saja pengurus strategis yang berdomisili di desa tersebut?"*.

---

## 5. ARSITEKTUR PORTAL KHUSUS PENGURUS BER-SK (*KADER SELF-SERVICE*)

Untuk mengakomodasi kebutuhan pengurus yang akan masuk (*login*) ke dalam sistem secara mandiri:

### A. Alur Autentikasi Mandiri
- Pengurus melakukan login menggunakan **Nomor e-KTA** atau **NIK** beserta kata sandi pribadi.
- Sistem memvalidasi apakah NIK/KTA tersebut terdaftar sebagai pengurus aktif yang telah memiliki nomor SK terdata.

### B. Fitur Profil Mandiri & e-KTA Digital
- **Identitas Digital Resmi:** Kartu e-KTA digital berlatar biru tua-oranye khas Partai NasDem dilengkapi kode QR verifikasi.
- **Badge Keabsahan SK:** Menampilkan nomor registrasi SK pengurus (misal: *SK-DPW-SULUT/014/2024*), masa bakti, dan tingkatan organisasi.

### C. Mekanisme Proteksi Tambah Anggota (*Recruiter Gatekeeper*)
1. **Kondisi Akses Input Anggota:**
   ```typescript
   const canAddMember = member.isPengurus === true && 
                        member.nomorSk != null && 
                        member.status === 'Aktif';
   ```
2. **Jika Memenuhi Syarat (Ber-SK):**
   - Tombol **"+ Rekrut Kader Baru"** aktif.
   - Form pendaftaran anggota otomatis mengunci kolom **Nama Perekrut** dan **ID Perekrut** ke identitas pengurus yang sedang login (mencegah klaim rekrutmen sepihak).
3. **Jika Belum Mengantongi SK:**
   - Tombol tambah anggota dalam status nonaktif (*disabled*) dengan notifikasi:  
     *"Hak rekrutmen anggota baru hanya diperuntukkan bagi pengurus yang telah resmi terdaftar dalam SK Partai NasDem."*
4. **Pohon Rekrutmen Pribadi (*Personal Cadre Tree*):**
   - Pengurus dapat melihat daftar anggota yang telah berhasil ia rekrut secara langsung, beserta tanggal bergabung dan status keaktifan e-KTA mereka.

---

## 6. SISTEM PENGAJUAN PENGHAPUSAN (SOFT-DELETE & APPROVAL)

Untuk mencegah kehilangan data berharga akibat kelalaian atau sabotase di tingkat cabang:
1. **Tidak Ada Fitur Hard-Delete di Daerah:** Admin DPD/DPC/DPRt tidak memiliki tombol untuk menghapus baris basis data secara langsung.
2. **Formulir Pengajuan Hapus Berkas:** Admin daerah wajib mengisi:
   - Identitas Kader (Nama & NIK).
   - Kategori Alasan: *Meninggal Dunia, Pindah Parpol, Mengundurkan Diri, Pindah Domisili Keluar Wilayah, atau Berkas Duplikat*.
   - Keterangan & Catatan Operasional Lapangan.
3. **Tinjauan Super Admin DPW:**
   - Pengajuan masuk ke antrean *Pending*.
   - Super Admin DPW berwenang memeriksa dan memilih: **Setujui (Approve)** atau **Tolak (Reject)** disertai catatan alasan.
   - Setiap keputusan secara otomatis mencatat jejak audit (*Audit Log Trail*) permanen.

---

## 7. SISTEM AUDIT TRAIL & FILTER LENGKAP

Setiap tindakan operasional sistem terekam dalam tabel audit dengan 6 parameter penelusuran:
1. **Pencarian Bebas (*Search*):** Berdasarkan NIK, Nama Kader, Operator, atau Kata Kunci Alasan.
2. **Penyaring Wilayah (*Filter DPD*):** Menyaring 15 Kabupaten/Kota se-Sulut.
3. **Penyaring Jenis Aksi (*Action Filter*):** Mutasi Status, Kader Baru, Import Massal, Update Data, Hapus Data, atau Permohonan Hapus.
4. **Penyaring Status Mutasi (*Status Filter*):** Aktif, Pindah Partai, Pindah Domisili, Meninggal Dunia, atau Duplikat.
5. **Penyaring Rentang Waktu (*Time Filter*):** Hari Ini (24 Jam), 7 Hari Terakhir, 30 Hari Terakhir, atau Semua Waktu.
6. **Penyaring Operator (*Actor Filter*):** Berdasarkan nama pengurus/admin yang mengeksekusi perubahan.
7. **Ekspor Audit:** Fasilitas unduh data rekam jejak dalam format spreadsheet (.csv/.xlsx).

---

## 8. KESIMPULAN & TAHAP IMPLEMENTASI BERIKUTNYA

Struktur arsitektur ini memberikan pondasi yang kokoh, profesional, dan akuntabel bagi DPW Partai NasDem Sulawesi Utara. 

**Rencana Implementasi Teknis Berikutnya:**
1. **Tahap 1:** Memperbarui bilah navigasi (`Navbar`) di `App.tsx` agar secara otomatis menyesuaikan tampilan menu untuk Super Admin vs Admin Daerah (DPD/DPC/DPRt).
2. **Tahap 2:** Menambahkan proteksi tombol rekrutmen anggota baru hanya untuk pengurus yang memiliki status SK aktif.
3. **Tahap 3:** Menyediakan tampilan antarmuka khusus *Portal Mandiri Pengurus/Kader* untuk melihat e-KTA digital pribadi dan rekam jejak kader binaan.
