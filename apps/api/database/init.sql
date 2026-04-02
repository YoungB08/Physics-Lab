-- Khởi tạo cơ sở dữ liệu PostgreSQL cho nền tảng Vật lí THPT
-- Có thể chạy trực tiếp bằng psql hoặc qua docker exec

-- Khuyến nghị:
--   psql -U postgres -d vatly_thpt -f apps/api/database/init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE vai_tro AS ENUM ('HOC_SINH', 'GIAO_VIEN', 'QUAN_TRI_VIEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trang_thai_nguoi_dung AS ENUM ('HOAT_DONG', 'KHOA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE muc_do AS ENUM ('DE', 'TRUNG_BINH', 'KHO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE loai_cau_hoi AS ENUM ('MOT_DAP_AN', 'NHIEU_DAP_AN', 'DUNG_SAI', 'TU_LUAN_NGAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE nguon_cau_hoi AS ENUM ('NGAN_HANG', 'AI_GPT', 'AI_GEMINI', 'THU_CONG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trang_thai_duyet AS ENUM ('NHAP', 'CHO_DUYET', 'DA_DUYET', 'AN', 'LOAI_BO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS nguoi_dung (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  ten_hien_thi TEXT NOT NULL,
  mat_khau_hash TEXT NOT NULL,
  vai_tro vai_tro NOT NULL DEFAULT 'HOC_SINH',
  trang_thai trang_thai_nguoi_dung NOT NULL DEFAULT 'HOAT_DONG',
  lop_hoc TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chuong (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lop INTEGER NOT NULL,
  ten TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  thu_tu INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bai_hoc (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chuong_id TEXT NOT NULL REFERENCES chuong(id) ON DELETE CASCADE,
  ten TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  mo_ta TEXT,
  co_mo_phong BOOLEAN NOT NULL DEFAULT FALSE,
  co_ai BOOLEAN NOT NULL DEFAULT TRUE,
  thu_tu INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phan_kien_thuc (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bai_hoc_id TEXT NOT NULL REFERENCES bai_hoc(id) ON DELETE CASCADE,
  tieu_de TEXT NOT NULL,
  muc_do muc_do NOT NULL,
  noi_dung_markdown TEXT NOT NULL,
  hinh_minh_hoa TEXT,
  thu_tu INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mo_phong (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bai_hoc_id TEXT NOT NULL UNIQUE REFERENCES bai_hoc(id) ON DELETE CASCADE,
  loai_mo_phong TEXT NOT NULL,
  cau_hinh_json JSONB NOT NULL,
  tham_so_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS cau_hoi (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bai_hoc_id TEXT NOT NULL REFERENCES bai_hoc(id) ON DELETE CASCADE,
  phan_kien_thuc_id TEXT NULL REFERENCES phan_kien_thuc(id) ON DELETE SET NULL,
  nguon nguon_cau_hoi NOT NULL,
  muc_do muc_do NOT NULL,
  loai loai_cau_hoi NOT NULL,
  noi_dung TEXT NOT NULL,
  lua_chon_json JSONB,
  dap_an_dung_json JSONB NOT NULL,
  giai_thich TEXT,
  the_json JSONB,
  trang_thai_duyet trang_thai_duyet NOT NULL DEFAULT 'NHAP',
  so_lan_su_dung INTEGER NOT NULL DEFAULT 0,
  ty_le_dung DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS de_thi (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  giao_vien_id TEXT NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  ten TEXT NOT NULL,
  lop INTEGER NOT NULL,
  thoi_gian_phut INTEGER NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  cau_hinh_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bai_lam (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  de_thi_id TEXT NOT NULL REFERENCES de_thi(id) ON DELETE CASCADE,
  hoc_sinh_id TEXT NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  diem DOUBLE PRECISION NOT NULL DEFAULT 0,
  muc_do_hieu_bai DOUBLE PRECISION NOT NULL DEFAULT 0,
  chi_tiet_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lich_su_ai (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nguoi_dung_id TEXT NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
  nha_cung_cap TEXT NOT NULL,
  loai_tac_vu TEXT NOT NULL,
  prompt_rut_gon TEXT NOT NULL,
  ket_qua_rut_gon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chuong_lop ON chuong(lop);
CREATE INDEX IF NOT EXISTS idx_bai_hoc_chuong_id ON bai_hoc(chuong_id);
CREATE INDEX IF NOT EXISTS idx_phan_kien_thuc_bai_hoc_id ON phan_kien_thuc(bai_hoc_id);
CREATE INDEX IF NOT EXISTS idx_cau_hoi_bai_hoc_id ON cau_hoi(bai_hoc_id);
CREATE INDEX IF NOT EXISTS idx_cau_hoi_phan_kien_thuc_id ON cau_hoi(phan_kien_thuc_id);
CREATE INDEX IF NOT EXISTS idx_cau_hoi_muc_do ON cau_hoi(muc_do);
CREATE INDEX IF NOT EXISTS idx_cau_hoi_nguon ON cau_hoi(nguon);
CREATE INDEX IF NOT EXISTS idx_de_thi_giao_vien_id ON de_thi(giao_vien_id);
CREATE INDEX IF NOT EXISTS idx_bai_lam_de_thi_id ON bai_lam(de_thi_id);
CREATE INDEX IF NOT EXISTS idx_bai_lam_hoc_sinh_id ON bai_lam(hoc_sinh_id);
CREATE INDEX IF NOT EXISTS idx_lich_su_ai_nguoi_dung_id ON lich_su_ai(nguoi_dung_id);
CREATE INDEX IF NOT EXISTS idx_lich_su_ai_loai_tac_vu ON lich_su_ai(loai_tac_vu);

CREATE OR REPLACE FUNCTION cap_nhat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nguoi_dung_updated_at ON nguoi_dung;
CREATE TRIGGER trg_nguoi_dung_updated_at
BEFORE UPDATE ON nguoi_dung
FOR EACH ROW
EXECUTE FUNCTION cap_nhat_updated_at();
