import { Router } from 'express';
import { getLesson, listCurriculum } from '../controllers/lesson.controller.js';
const router = Router();
router.get('/chuong-trinh', listCurriculum);
router.get('/bai-hoc/:slug', getLesson);
export default router;
