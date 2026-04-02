import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { getAIStatus, postAI } from '../controllers/ai.controller.js';
const router = Router();
router.get('/trang-thai', getAIStatus);
router.post('/', authRequired, postAI);
export default router;
