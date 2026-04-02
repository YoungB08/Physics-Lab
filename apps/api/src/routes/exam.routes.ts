import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import {
  examStatusHandler,
  exportExamPdfHandler,
  getExamDetailHandler,
  getExamList,
  getThongKe,
  joinExamHandler,
  integrityEventHandler,
  patchExamHandler,
  postExamActionHandler,
  postTaoDe,
  saveAnswerHandler,
  submitAttemptHandler,
  tabOutHandler
} from '../controllers/exam.controller.js';
const router = Router();
router.post('/tao-de', authRequired, requireRoles('GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT'), asyncHandler(postTaoDe));
router.get('/danh-sach', authRequired, requireRoles('GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT'), asyncHandler(getExamList));
router.get('/chi-tiet/:id', authRequired, requireRoles('GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT'), asyncHandler(getExamDetailHandler));
router.get('/xuat-pdf/:id', authRequired, requireRoles('GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT'), asyncHandler(exportExamPdfHandler));
router.patch('/:id', authRequired, requireRoles('GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT'), asyncHandler(patchExamHandler));
router.post('/:id/:action', authRequired, requireRoles('GIAO_VIEN', 'QUAN_TRI_VIEN', 'CMS_ROOT'), asyncHandler(postExamActionHandler));
router.get('/phong-thi/:qrToken/trang-thai', authRequired, asyncHandler(examStatusHandler));
router.post('/phong-thi/:qrToken/vao', authRequired, asyncHandler(joinExamHandler));
router.post('/bai-lam/:attemptId/cau', authRequired, asyncHandler(saveAnswerHandler));
router.post('/bai-lam/:attemptId/tab-out', authRequired, asyncHandler(tabOutHandler));
router.post('/bai-lam/:attemptId/integrity', authRequired, asyncHandler(integrityEventHandler));
router.post('/bai-lam/:attemptId/nop', authRequired, asyncHandler(submitAttemptHandler));
router.get('/thong-ke', authRequired, asyncHandler(getThongKe));
export default router;
