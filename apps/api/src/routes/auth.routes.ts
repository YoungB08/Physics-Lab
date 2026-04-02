import { Router } from 'express';
import { postDangKy, postDangNhap } from '../controllers/auth.controller.js';
const router = Router();
router.post('/dang-ky', postDangKy);
router.post('/dang-nhap', postDangNhap);
export default router;
