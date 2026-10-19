-- ========================================================================
-- OTOMASI PEMISAHAN DEWAN PERTIMBANGAN & DEWAN PAKAR DI SUPABASE
-- Skrip ini memastikan setiap data pengurus yang di-import melalui
-- Supabase SQL Editor langsung dikenali dan dipisahkan sub-organisasinya.
-- ========================================================================

-- 1. FUNGSI TRIGGER NORMALISASI OTOMATIS
CREATE OR REPLACE FUNCTION public.fn_auto_normalize_dewan_members()
RETURNS TRIGGER AS $$
BEGIN
  -- A. DEWAN PERTIMBANGAN
  IF NEW.wilayah_penugasan ILIKE '%pertimbangan%' 
     OR NEW.jabatan ILIKE '%pertimbangan%' 
     OR NEW.jabatan ILIKE '%wanhat%' 
     OR NEW.jabatan ILIKE '%wantim%' THEN
    NEW.is_pengurus := TRUE;
    IF NEW.tingkat_kepengurusan = 'DPW' OR NEW.dpd = 'Sulawesi Utara' THEN
      NEW.wilayah_penugasan := 'DEWAN PERTIMBANGAN WILAYAH';
    ELSE
      NEW.wilayah_penugasan := 'I. DEWAN PERTIMBANGAN';
    END IF;

  -- B. DEWAN PAKAR
  ELSIF NEW.wilayah_penugasan ILIKE '%pakar%' 
        OR NEW.jabatan ILIKE '%pakar%' 
        OR NEW.jabatan ILIKE '%wanpak%' THEN
    NEW.is_pengurus := TRUE;
    IF NEW.tingkat_kepengurusan = 'DPW' OR NEW.dpd = 'Sulawesi Utara' THEN
      NEW.wilayah_penugasan := 'DEWAN PAKAR WILAYAH';
    ELSE
      NEW.wilayah_penugasan := 'II. DEWAN PAKAR';
    END IF;

  -- C. DEWAN PIMPINAN (DPD / DPW / DPC / DPRt)
  ELSIF NEW.is_pengurus = TRUE OR NEW.nomor_sk IS NOT NULL OR NEW.wilayah_penugasan ILIKE '%pimpinan%' THEN
    IF NEW.tingkat_kepengurusan = 'DPW' OR NEW.dpd = 'Sulawesi Utara' THEN
      NEW.wilayah_penugasan := 'DEWAN PIMPINAN WILAYAH';
    ELSIF NEW.tingkat_kepengurusan = 'DPC' THEN
      NEW.wilayah_penugasan := 'III. DEWAN PIMPINAN CABANG';
    ELSIF NEW.tingkat_kepengurusan = 'DPRt' THEN
      NEW.wilayah_penugasan := 'DEWAN PIMPINAN RANTING';
    ELSE
      NEW.wilayah_penugasan := 'III. DEWAN PIMPINAN DAERAH';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. DAFTARKAN TRIGGER PADA TABEL PUBLIC.MEMBERS
DROP TRIGGER IF EXISTS trg_auto_normalize_dewan_members ON public.members;
CREATE TRIGGER trg_auto_normalize_dewan_members
BEFORE INSERT OR UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_normalize_dewan_members();

-- 3. PERBAIKI DATA LAMA YANG SUDAH TERLANJUR MASUK KE DATABASE SUPABASE
-- Normalisasi Dewan Pertimbangan Tingkat DPD / DPC
UPDATE public.members
SET wilayah_penugasan = 'I. DEWAN PERTIMBANGAN', is_pengurus = TRUE
WHERE (wilayah_penugasan ILIKE '%pertimbangan%' OR jabatan ILIKE '%pertimbangan%' OR jabatan ILIKE '%wanhat%')
  AND (tingkat_kepengurusan IS NULL OR tingkat_kepengurusan != 'DPW')
  AND (dpd IS NULL OR dpd != 'Sulawesi Utara');

-- Normalisasi Dewan Pakar Tingkat DPD / DPC
UPDATE public.members
SET wilayah_penugasan = 'II. DEWAN PAKAR', is_pengurus = TRUE
WHERE (wilayah_penugasan ILIKE '%pakar%' OR jabatan ILIKE '%pakar%' OR jabatan ILIKE '%wanpak%')
  AND (tingkat_kepengurusan IS NULL OR tingkat_kepengurusan != 'DPW')
  AND (dpd IS NULL OR dpd != 'Sulawesi Utara');

-- Normalisasi Dewan Pertimbangan Tingkat DPW
UPDATE public.members
SET wilayah_penugasan = 'DEWAN PERTIMBANGAN WILAYAH', is_pengurus = TRUE
WHERE (wilayah_penugasan ILIKE '%pertimbangan%' OR jabatan ILIKE '%pertimbangan%')
  AND (tingkat_kepengurusan = 'DPW' OR dpd = 'Sulawesi Utara');

-- Normalisasi Dewan Pakar Tingkat DPW
UPDATE public.members
SET wilayah_penugasan = 'DEWAN PAKAR WILAYAH', is_pengurus = TRUE
WHERE (wilayah_penugasan ILIKE '%pakar%' OR jabatan ILIKE '%pakar%')
  AND (tingkat_kepengurusan = 'DPW' OR dpd = 'Sulawesi Utara');

-- Normalisasi Dewan Pimpinan Daerah yang belum bernomor romawi III
UPDATE public.members
SET wilayah_penugasan = 'III. DEWAN PIMPINAN DAERAH'
WHERE (wilayah_penugasan = 'DEWAN PIMPINAN DAERAH' OR wilayah_penugasan ILIKE 'DPD %')
  AND (tingkat_kepengurusan IS NULL OR tingkat_kepengurusan = 'DPD');
