-- ========================================================================
-- SKEMA BASIS DATA SUPABASE UNTUK SISTEM SHADOW DATABASE NASDEM SULUT
-- Dewan Pimpinan Wilayah (DPW) Partai NasDem Sulawesi Utara
-- ========================================================================

-- 1. TABEL UTAMA: MEMBERS (ANGGOTA & PENGURUS BER-SK)
CREATE TABLE IF NOT EXISTS public.members (
    nik VARCHAR(50) PRIMARY KEY,
    nomor_ekta VARCHAR(50),
    nama_lengkap VARCHAR(255) NOT NULL,
    nomor_hp VARCHAR(50) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    sosmed VARCHAR(150) DEFAULT NULL,
    
    -- Wilayah Domisili Sesuai Alamat KTP
    dpd VARCHAR(100) NOT NULL,      -- Kabupaten / Kota
    dpc VARCHAR(100) NOT NULL,      -- Kecamatan
    dprt VARCHAR(100) NOT NULL,     -- Kelurahan / Desa
    
    -- Struktur Organisasi & Legalitas SK
    is_pengurus BOOLEAN DEFAULT FALSE,
    tingkat_kepengurusan VARCHAR(30) DEFAULT 'Bukan Pengurus', -- 'DPW', 'DPD', 'DPC', 'DPRt'
    wilayah_penugasan VARCHAR(100),
    nomor_sk VARCHAR(100),          -- Nomor Surat Keputusan Resmi
    tanggal_sk DATE,                -- Tanggal Terbit SK
    kode_referral VARCHAR(50),       -- Kode Referral Perekrut Lapangan
    
    -- Jabatan & Status Keanggotaan
    jabatan VARCHAR(150) DEFAULT 'Anggota Biasa',
    status VARCHAR(50) DEFAULT 'Aktif', -- 'Aktif', 'Non-Aktif (Meninggal)', 'Non-Aktif (Pindah Partai/Mundur)', 'Non-Aktif (Pindah Domisili)'
    tanggal_bergabung DATE DEFAULT CURRENT_DATE,
    catatan_mutasi TEXT,
    terakhir_diubah TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    diubah_oleh VARCHAR(100),
    
    -- Berkas & Biodata Personal
    foto_profil_url TEXT,
    foto_ktp_url TEXT,
    jenis_kelamin VARCHAR(20),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    alamat_lengkap TEXT,
    agama VARCHAR(50),
    pekerjaan VARCHAR(100),
    status_ktp_verified BOOLEAN DEFAULT TRUE,
    
    -- Atribusi Kader Perekrut Lapangan (Referral)
    kader_perekrut_nama VARCHAR(255),
    kader_perekrut_nik VARCHAR(16),
    kader_perekrut_ekta VARCHAR(50),
    kader_perekrut_jabatan VARCHAR(150),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks untuk Performa Query Cepat (Dashboard & Filter)
CREATE INDEX IF NOT EXISTS idx_members_dpd ON public.members (dpd);
CREATE INDEX IF NOT EXISTS idx_members_dpc ON public.members (dpc);
CREATE INDEX IF NOT EXISTS idx_members_dprt ON public.members (dprt);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_is_pengurus ON public.members (is_pengurus);
CREATE INDEX IF NOT EXISTS idx_members_nomor_ekta ON public.members (nomor_ekta);

-- 2. TABEL LOG AUDIT: AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    member_nik VARCHAR(50) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'STATUS_CHANGE', 'CREATE', 'IMPORT_MASSAL', 'UPDATE', 'DELETE', 'DELETE_REQUEST'
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    reason TEXT NOT NULL,
    actor VARCHAR(100) NOT NULL,
    dpd VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_dpd ON public.audit_logs (dpd);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

-- 3. TABEL PERMOHONAN HAPUS: DELETION_REQUESTS (SOFT-DELETE APPROVAL)
CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_nik VARCHAR(50) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    dpd VARCHAR(100) NOT NULL,
    dpc VARCHAR(100) NOT NULL,
    dprt VARCHAR(100) NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_status ON public.deletion_requests (status);

-- 4. KEBIJAKAN ROW LEVEL SECURITY (RLS) - Mode Siap Pakai
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Penuh untuk Anon/Public Key (Bisa disesuaikan setelah autentikasi supabase penuh)
CREATE POLICY "Akses Baca Bebas" ON public.members FOR SELECT USING (true);
CREATE POLICY "Akses Tambah/Ubah Bebas" ON public.members FOR ALL USING (true);

CREATE POLICY "Akses Audit Baca Bebas" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Akses Audit Tambah Bebas" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Akses Deletion Requests Bebas" ON public.deletion_requests FOR ALL USING (true);

-- 5. AKTIFKAN REPLIKASI REALTIME SUPABASE UNTUK SEMUA TABEL
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deletion_requests;

