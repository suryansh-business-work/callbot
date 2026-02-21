import { Router } from 'express';
import { initiateCall, getApiDocs } from './openapi.controllers';
import { softAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

/** GET /api/v1/docs - API documentation (public) */
router.get('/docs', getApiDocs);

/** POST /api/v1/call - Initiate an AI call (soft auth — extracts user if JWT present) */
router.post('/call', softAuthMiddleware, initiateCall);

export default router;
