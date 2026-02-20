import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getSettings,
  updateSettings,
  getResolvedConfig,
  validateTwilio,
  validateOpenAi,
  validateSarvam,
  getCredits,
} from './settings.controllers';

const router = Router();

/** GET /api/settings - Get current user's settings */
router.get('/', authMiddleware, getSettings);

/** PUT /api/settings - Update current user's settings */
router.put('/', authMiddleware, updateSettings);

/** GET /api/settings/resolved - Get resolved (env or custom) config */
router.get('/resolved', authMiddleware, getResolvedConfig);

/** POST /api/settings/validate/twilio - Validate Twilio credentials */
router.post('/validate/twilio', authMiddleware, validateTwilio);

/** POST /api/settings/validate/openai - Validate OpenAI credentials */
router.post('/validate/openai', authMiddleware, validateOpenAi);

/** POST /api/settings/validate/sarvam - Validate Sarvam credentials */
router.post('/validate/sarvam', authMiddleware, validateSarvam);

/** GET /api/settings/credits - Get all service credits/balances */
router.get('/credits', authMiddleware, getCredits);

export default router;
