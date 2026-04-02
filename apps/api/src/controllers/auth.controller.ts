import type { Request, Response } from 'express';
import { dangNhapSchema, dangKySchema } from '../validators/auth.validator.js';
import { dangKy, dangNhap } from '../services/auth.service.js';

export async function postDangKy(req: Request, res: Response) {
  const payload = dangKySchema.parse(req.body);
  const data = await dangKy(payload);
  res.json(data);
}

export async function postDangNhap(req: Request, res: Response) {
  const payload = dangNhapSchema.parse(req.body);
  const data = await dangNhap(payload);
  res.json(data);
}
