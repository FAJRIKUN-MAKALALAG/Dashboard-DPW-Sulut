-- ========================================================================
-- TABEL PENGELOLAAN PENGGUNA & HAK AKSES ADMIN (OPSI B)
-- Dewan Pimpinan Wilayah (DPW) Partai NasDem Sulawesi Utara
-- ========================================================================
-- Hanya SUPER ADMIN yang dapat membuatkan akun admin, menentukan peran (DPW, DPD, DPC, DPRt),
-- dan menentukan cakupan wilayah akses untuk masing-masing admin.

CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_nik VARCHAR(50) REFERENCES public.members(nik) ON DELETE SET NULL,
    nomor_ekta VARCHAR(50),
    username VARCHAR(100) UNIQUE NOT NULL, -- NIK KTP, E-KTA, atau Username Admin
    password_hash VARCHAR(255) NOT NULL,  -- Kata sandi login
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN_DPD', -- 'SUPER_ADMIN', 'ADMIN_DPW', 'ADMIN_DPD', 'ADMIN_DPC', 'ADMIN_DPRT'
    dpd_access VARCHAR(100) DEFAULT 'ALL',         -- 'ALL' atau nama DPD spesifik
    dpc_access VARCHAR(100) DEFAULT 'ALL',         -- 'ALL' atau nama DPC/Kecamatan spesifik
    dprt_access VARCHAR(100) DEFAULT 'ALL',        -- 'ALL' atau nama DPRt/Desa/Kelurahan spesifik
    jabatan VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks untuk pencarian cepat saat login dan manajemen akun
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users (username);
CREATE INDEX IF NOT EXISTS idx_app_users_member_nik ON public.app_users (member_nik);
CREATE INDEX IF NOT EXISTS idx_app_users_nomor_ekta ON public.app_users (nomor_ekta);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users (role);

-- Kebijakan Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses App Users Penuh" ON public.app_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Aktifkan Sinkronisasi Realtime Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;

-- SEED AKUN SUPER ADMIN UTAMA
-- NIK: 7106033003050001
-- Password: NasDem15
INSERT INTO public.app_users (
    member_nik,
    nomor_ekta,
    username,
    password_hash,
    full_name,
    role,
    dpd_access,
    dpc_access,
    dprt_access,
    jabatan,
    is_active
) VALUES (
    '7106033003050001',
    'KT-7106-2024-0001',
    '7106033003050001',
    'NasDem15',
    'Super Admin Utama DPW NasDem',
    'SUPER_ADMIN',
    'ALL',
    'ALL',
    'ALL',
    'Super Administrator DPW Partai NasDem Sulut',
    TRUE
)
ON CONFLICT (username) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    dpd_access = EXCLUDED.dpd_access,
    is_active = TRUE;
