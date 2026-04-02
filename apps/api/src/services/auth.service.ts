import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { signAccessToken, signRefreshToken } from './token.service.js';
import { HttpError, assertFeatureEnabled, logSystem } from './system.service.js';

export async function dangKy(input: { email: string; tenHienThi: string; matKhau: string; vaiTro: 'HOC_SINH' | 'GIAO_VIEN'; lopHoc?: string }) {
  await assertFeatureEnabled('publicRegister');
  await assertFeatureEnabled(input.vaiTro === 'GIAO_VIEN' ? 'registerTeacher' : 'registerStudent');
  const matKhauHash = await bcrypt.hash(input.matKhau, 10);
  const user = await prisma.nguoiDung.create({
    data: {
      email: input.email,
      tenHienThi: input.tenHienThi,
      hoTen: input.tenHienThi,
      matKhauHash,
      vaiTro: input.vaiTro === 'GIAO_VIEN' ? 'GIAO_VIEN' : 'HOC_SINH',
      lopHoc: input.lopHoc
    }
  });
  await logSystem({ nhom: 'auth', hanhDong: 'register', doiTuong: user.email, nguoiDungId: user.id });
  return { user, accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

export async function dangNhap(input: { email: string; matKhau: string }) {
  const user = await prisma.nguoiDung.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(404, 'Tài khoản không tồn tại.');
  const ok = await bcrypt.compare(input.matKhau, user.matKhauHash);
  if (!ok) throw new HttpError(401, 'Sai mật khẩu.');
  if (user.trangThai !== 'HOAT_DONG') throw new HttpError(403, 'Tài khoản đang bị khóa.');
  await logSystem({ nhom: 'auth', hanhDong: 'login', doiTuong: user.email, nguoiDungId: user.id });
  return { user, accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}
