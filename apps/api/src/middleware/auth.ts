import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/express.js';

export function authRequired(req: Request & { user?: AuthUser }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Thiếu token.' });
  try {
    req.user = jwt.verify(auth.slice(7), env.JWT_ACCESS_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ.' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request & { user?: AuthUser }, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.vaiTro)) return res.status(403).json({ message: 'Không có quyền truy cập.' });
    next();
  };
}
