-- Seed SQL mẫu cho PostgreSQL
-- Mật khẩu mẫu dạng bcrypt của chuỗi 123456

INSERT INTO nguoi_dung (email, ten_hien_thi, mat_khau_hash, vai_tro, lop_hoc)
VALUES
  ('admin@vatly.vn', 'Quản trị hệ thống', '$2a$10$rWw4T6JmMBlfQq9A4s46vO6QfP6A0vQ2YQ0xU4A5uM6qz0P4s9I1W', 'QUAN_TRI_VIEN', NULL),
  ('giaovien@vatly.vn', 'Giáo viên mẫu', '$2a$10$rWw4T6JmMBlfQq9A4s46vO6QfP6A0vQ2YQ0xU4A5uM6qz0P4s9I1W', 'GIAO_VIEN', NULL),
  ('hocsinh@vatly.vn', 'Học sinh mẫu', '$2a$10$rWw4T6JmMBlfQq9A4s46vO6QfP6A0vQ2YQ0xU4A5uM6qz0P4s9I1W', 'HOC_SINH', '12A1')
ON CONFLICT (email) DO NOTHING;

INSERT INTO chuong (lop, ten, slug, thu_tu)
VALUES
  (12, 'Từ trường', 'tu-truong-lop-12', 1),
  (12, 'Khí lí tưởng', 'khi-li-tuong-lop-12', 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bai_hoc (chuong_id, ten, slug, mo_ta, co_mo_phong, co_ai, thu_tu)
SELECT id, 'Lực Lorentz', 'luc-lorentz', 'Chuyển động của hạt tích điện trong từ trường', TRUE, TRUE, 1
FROM chuong WHERE slug = 'tu-truong-lop-12'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bai_hoc (chuong_id, ten, slug, mo_ta, co_mo_phong, co_ai, thu_tu)
SELECT id, 'Định luật Boyle - Mariotte', 'dinh-luat-boyle', 'Quan hệ giữa áp suất và thể tích khi nhiệt độ không đổi', TRUE, TRUE, 1
FROM chuong WHERE slug = 'khi-li-tuong-lop-12'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO phan_kien_thuc (bai_hoc_id, tieu_de, muc_do, noi_dung_markdown, thu_tu)
SELECT id, 'Khái niệm lực Lorentz', 'DE', 'Lực Lorentz là lực từ tác dụng lên hạt mang điện đang chuyển động trong từ trường.', 1
FROM bai_hoc WHERE slug = 'luc-lorentz'
ON CONFLICT DO NOTHING;

INSERT INTO phan_kien_thuc (bai_hoc_id, tieu_de, muc_do, noi_dung_markdown, thu_tu)
SELECT id, 'Công thức lực Lorentz', 'TRUNG_BINH', 'Độ lớn: F = |q| v B sin(alpha).', 2
FROM bai_hoc WHERE slug = 'luc-lorentz'
ON CONFLICT DO NOTHING;

INSERT INTO mo_phong (bai_hoc_id, loai_mo_phong, cau_hinh_json, tham_so_json)
SELECT id, 'quy-dao-hat-tich-dien', '{"view":"2d","chart":"scatter"}'::jsonb, '{"B":2,"v":10,"q":1,"m":1}'::jsonb
FROM bai_hoc WHERE slug = 'luc-lorentz'
ON CONFLICT (bai_hoc_id) DO NOTHING;

INSERT INTO cau_hoi (bai_hoc_id, nguon, muc_do, loai, noi_dung, lua_chon_json, dap_an_dung_json, giai_thich, trang_thai_duyet)
SELECT id, 'NGAN_HANG', 'TRUNG_BINH', 'MOT_DAP_AN',
       'Khi cảm ứng từ tăng còn các đại lượng khác giữ nguyên thì bán kính quỹ đạo của hạt tích điện sẽ như thế nào?',
       '["Tăng","Giảm","Không đổi","Tăng rồi giảm"]'::jsonb,
       '["Giảm"]'::jsonb,
       'R = mv / |q|B nên B tăng thì R giảm.',
       'DA_DUYET'
FROM bai_hoc WHERE slug = 'luc-lorentz'
ON CONFLICT DO NOTHING;
