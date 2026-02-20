import { Router } from 'express';
import { initiateCall, getApiDocs } from './openapi.controllers';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/** GET /api/v1/docs - API documentation (public) */
router.get('/docs', getApiDocs);

/** POST /api/v1/call - Initiate an AI call (requires JWT auth) */
router.post('/call', authMiddleware, initiateCall);

export default router;
