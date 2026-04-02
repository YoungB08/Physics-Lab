import { z } from 'zod';
export const dangKySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  tenHienThi: z.string().min(2),
  matKhau: z.string().min(6),
  vaiTro: z.enum(['HOC_SINH', 'GIAO_VIEN']),
  lopHoc: z.string().optional()
});
export const dangNhapSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  matKhau: z.string().trim().min(6)
});
