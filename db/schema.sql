-- ==============================================================================
-- SKEMA DATABASE POSTGRESQL (NEON SERVERLESS) - SISTEM ABSENSI PEGAWAI STUPA
-- Project: SIMPEG STUPA / SIPEG STUPA
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL KANTOR (Data Lokasi Kantor & Konfigurasi Jam Kerja Spesifik)
CREATE TABLE IF NOT EXISTS kantor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(150) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    radius_meter INT NOT NULL DEFAULT 100,
    jam_masuk_mulai TIME NOT NULL DEFAULT '06:30:00',
    jam_masuk_akhir TIME NOT NULL DEFAULT '07:30:00',
    jam_pulang_senin_kamis_mulai TIME NOT NULL DEFAULT '15:30:00',
    jam_pulang_jumat_mulai TIME NOT NULL DEFAULT '13:00:00',
    jam_pulang_akhir TIME NOT NULL DEFAULT '18:00:00',
    jam_masuk TIME NOT NULL DEFAULT '07:30:00',
    jam_pulang TIME NOT NULL DEFAULT '16:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penambahan Kolom Baru ke Tabel Kantor jika sudah ada
ALTER TABLE kantor ADD COLUMN IF NOT EXISTS jam_masuk_mulai TIME NOT NULL DEFAULT '06:30:00';
ALTER TABLE kantor ADD COLUMN IF NOT EXISTS jam_masuk_akhir TIME NOT NULL DEFAULT '07:30:00';
ALTER TABLE kantor ADD COLUMN IF NOT EXISTS jam_pulang_senin_kamis_mulai TIME NOT NULL DEFAULT '15:30:00';
ALTER TABLE kantor ADD COLUMN IF NOT EXISTS jam_pulang_jumat_mulai TIME NOT NULL DEFAULT '13:00:00';
ALTER TABLE kantor ADD COLUMN IF NOT EXISTS jam_pulang_akhir TIME NOT NULL DEFAULT '18:00:00';

-- 3. TABEL PEGAWAI (Akun Pegawai & Admin, Kuota Cuti, Foto Profil & Data Diri)
CREATE TABLE IF NOT EXISTS pegawai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(50) UNIQUE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'pegawai')),
    jabatan VARCHAR(100) DEFAULT 'Staff',
    sisa_cuti_tahunan INT NOT NULL DEFAULT 12,
    no_hp VARCHAR(30),
    alamat TEXT,
    foto_profil_url TEXT,
    face_embedding JSONB,
    device_id_bound TEXT,
    is_first_login BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penambahan Kolom Baru ke Tabel Pegawai
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS jabatan VARCHAR(100) DEFAULT 'Staff';
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS no_hp VARCHAR(30);
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS foto_profil_url TEXT;

-- 4. TABEL ABSENSI (Log Presensi Masuk & Pulang, Geofencing & Foto)
CREATE TABLE IF NOT EXISTS absensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pegawai_id UUID NOT NULL REFERENCES pegawai(id) ON DELETE CASCADE,
    waktu_absen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipe_absen VARCHAR(20) NOT NULL CHECK (tipe_absen IN ('masuk', 'pulang')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('tepat_waktu', 'terlambat', 'mendahului', 'dinas_luar', 'cuti_tahunan', 'cuti_sakit', 'cuti', 'sakit')),
    waktu_terlambat INT NOT NULL DEFAULT 0, -- Dalam menit
    waktu_mendahului INT NOT NULL DEFAULT 0, -- Dalam menit
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    jarak_dari_kantor NUMERIC(10, 2), -- Dalam meter
    url_foto_cloudinary TEXT,
    device_id_used TEXT,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update constraint jika database sudah ada
ALTER TABLE absensi DROP CONSTRAINT IF EXISTS absensi_status_check;
ALTER TABLE absensi ADD CONSTRAINT absensi_status_check CHECK (status IN ('tepat_waktu', 'terlambat', 'mendahului', 'dinas_luar', 'cuti_tahunan', 'cuti_sakit', 'cuti', 'sakit'));


-- 5. TABEL HARI LIBUR (Libur Nasional, Cuti Bersama, & Libur Khusus Sekolah)
CREATE TABLE IF NOT EXISTS hari_libur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL UNIQUE,
    keterangan VARCHAR(255) NOT NULL,
    tipe VARCHAR(50) NOT NULL DEFAULT 'nasional', -- 'nasional' atau 'khusus'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hari_libur_tanggal ON hari_libur(tanggal);

-- 6. TABEL PENGAJUAN (Cuti Tahunan, Sakit, Dinas Luar, & Lupa Absen)
CREATE TABLE IF NOT EXISTS pengajuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pegawai_id UUID NOT NULL REFERENCES pegawai(id) ON DELETE CASCADE,
    tipe_pengajuan VARCHAR(30) NOT NULL CHECK (tipe_pengajuan IN ('cuti_tahunan', 'cuti_sakit', 'dinas_luar', 'lupa_absen')),
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    jumlah_hari_kerja INT NOT NULL DEFAULT 1,
    alasan TEXT,
    url_dokumen_pendukung_cloudinary TEXT,
    tipe_absen_req VARCHAR(20),
    waktu_presensi_req TIME,
    status_presensi_req VARCHAR(30) DEFAULT 'tepat_waktu',
    jarak_meter_req NUMERIC DEFAULT 100,
    url_foto_selfie TEXT,
    status_approval VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status_approval IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES pegawai(id) ON DELETE SET NULL,
    catatan_admin TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update constraint & columns jika tabel sudah ada sebelumnya
ALTER TABLE pengajuan DROP CONSTRAINT IF EXISTS pengajuan_tipe_pengajuan_check;
ALTER TABLE pengajuan ADD CONSTRAINT pengajuan_tipe_pengajuan_check CHECK (tipe_pengajuan IN ('cuti_tahunan', 'cuti_sakit', 'dinas_luar', 'lupa_absen'));
ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS tipe_absen_req VARCHAR(20);
ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS waktu_presensi_req TIME;
ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS status_presensi_req VARCHAR(30) DEFAULT 'tepat_waktu';
ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS jarak_meter_req NUMERIC DEFAULT 100;
ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS url_foto_selfie TEXT;

-- 6. FUNGSI RUMUS HAVERSINE (VALIDASI JARAK DALAM METER)
DROP FUNCTION IF EXISTS hitung_jarak_haversine(numeric, numeric, numeric, numeric) CASCADE;
CREATE OR REPLACE FUNCTION hitung_jarak_haversine(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    r NUMERIC := 6371000;
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2.0)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0)^2;
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    RETURN ROUND((r * c)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. FUNGSI MENGHITUNG JUMLAH HARI KERJA (EKSKLUSI SABTU & MINGGU)
DROP FUNCTION IF EXISTS hitung_hari_kerja(date, date) CASCADE;
CREATE OR REPLACE FUNCTION hitung_hari_kerja(tgl_awal DATE, tgl_akhir DATE)
RETURNS INTEGER AS $$
DECLARE
    hari_kerja INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO hari_kerja
    FROM generate_series(tgl_awal, tgl_akhir, '1 day'::interval) d
    WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);
    RETURN COALESCE(hari_kerja, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. TRIGGER OTOMATIS: POTONG SISA CUTI TAHUNAN SAAT STATUS MENJADI 'APPROVED'
CREATE OR REPLACE FUNCTION trigger_proses_cuti_approval()
RETURNS TRIGGER AS $$
DECLARE
    hari_kerja_req INT;
    sisa_saat_ini INT;
BEGIN
    IF NEW.status_approval = 'approved' AND (OLD.status_approval IS DISTINCT FROM 'approved') THEN
        hari_kerja_req := hitung_hari_kerja(NEW.tanggal_mulai, NEW.tanggal_selesai);
        NEW.jumlah_hari_kerja := hari_kerja_req;

        IF NEW.tipe_pengajuan = 'cuti_tahunan' THEN
            SELECT sisa_cuti_tahunan INTO sisa_saat_ini 
            FROM pegawai 
            WHERE id = NEW.pegawai_id 
            FOR UPDATE;

            IF sisa_saat_ini < hari_kerja_req THEN
                RAISE EXCEPTION 'Gagal menyetujui: Sisa cuti tahunan pegawai tidak mencukupi (Tersisa: % hari, Dibutuhkan: % hari).', sisa_saat_ini, hari_kerja_req;
            END IF;

            UPDATE pegawai 
            SET sisa_cuti_tahunan = sisa_cuti_tahunan - hari_kerja_req,
                updated_at = NOW()
            WHERE id = NEW.pegawai_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pengajuan_cuti_approval ON pengajuan;
CREATE TRIGGER trg_pengajuan_cuti_approval
BEFORE UPDATE ON pengajuan
FOR EACH ROW
EXECUTE FUNCTION trigger_proses_cuti_approval();

-- 9. INDEKS UNTUK PERFORMA
CREATE INDEX IF NOT EXISTS idx_absensi_pegawai_waktu ON absensi(pegawai_id, waktu_absen);
CREATE INDEX IF NOT EXISTS idx_pengajuan_pegawai_status ON pengajuan(pegawai_id, status_approval);
CREATE INDEX IF NOT EXISTS idx_pegawai_email ON pegawai(email);
CREATE INDEX IF NOT EXISTS idx_pegawai_role ON pegawai(role);
