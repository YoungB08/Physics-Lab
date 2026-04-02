import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createConversationHandler, getConversationDetailHandler, listConversationsHandler, sendMessageHandler } from '../controllers/chat.controller.js';

const router = Router();

router.use(authRequired);
router.get('/conversations', listConversationsHandler);
router.post('/conversations', createConversationHandler);
router.get('/conversations/:id', getConversationDetailHandler);
router.post('/conversations/:id/messages', sendMessageHandler);

export default router;
