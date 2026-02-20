/**
 * ─── Streaming Routes ───────────────────────────────────────────────────────
 *
 * All HTTP routes for the real-time streaming AI call system.
 * These sit alongside the existing `/api/ai/` routes.
 */

import { Router } from 'express';
import {
  initiateStreamCall,
  handleStreamRespond,
  handleStreamStatus,
  getStreamingSessions,
} from './streaming.controllers';

const router = Router();

// Initiate a streaming AI call (from the UI)
router.post('/call', initiateStreamCall);

// Twilio webhook: user speech arrives
router.post('/respond', handleStreamRespond);

// Twilio webhook: call status updates
router.post('/status', handleStreamStatus);

// Debug: list active streaming sessions
router.get('/sessions', getStreamingSessions);

export default router;
