import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

type TokenUser = { id: string; email: string; vaiTro: string };

export function signAccessToken(user: TokenUser) {
  return jwt.sign({ id: user.id, email: user.email, vaiTro: user.vaiTro }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions);
}

export function signRefreshToken(user: TokenUser) {
  return jwt.sign({ id: user.id, email: user.email, vaiTro: user.vaiTro }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions);
}
