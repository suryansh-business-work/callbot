import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { sendEmail, validateSmtp } from './emails.controllers';

const router = Router();

/** POST /api/emails/send — Send an email on behalf of the user */
router.post('/send', authMiddleware, sendEmail);

/** POST /api/emails/validate — Verify SMTP connection */
router.post('/validate', authMiddleware, validateSmtp);

export default router;
