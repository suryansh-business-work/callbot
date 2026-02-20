/**
 * ─── Streaming Controllers ──────────────────────────────────────────────────
 *
 * HTTP endpoints for the streaming AI call flow:
 *  - POST /api/ai/stream/call     → Initiate a streaming AI call
 *  - POST /api/ai/stream/respond  → Twilio webhook: user speech → streaming AI
 *  - POST /api/ai/stream/status   → Twilio webhook: call status updates
 *  - GET  /api/ai/stream/sessions → List active streaming sessions
 */

import { Request, Response } from 'express';
import { aiCallSchema } from '../ai/ai.validators';
import { initiateStreamingCall } from './streaming.services';
import {
  handleStreamingSpeech,
  handleStreamCallStatus,
  getActiveStreamSessions,
} from './stream.orchestrator';
import { getTunnelUrl } from '../tunnel';
import { envConfig } from '../config';

/**
 * POST /api/ai/stream/call
 * Initiate an AI call using the real-time streaming architecture.
 */
export const initiateStreamCall = async (req: Request, res: Response): Promise<void> => {
  const parsed = aiCallSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { to, message, voice, systemPrompt, agentId, language, aiModel } = parsed.data;
    const result = await initiateStreamingCall(
      to, message, voice, systemPrompt, agentId, undefined, language, aiModel
    );

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('[StreamController] initiateStreamCall error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to initiate streaming call';
    res.status(500).json({ success: false, message: errMsg });
  }
};

/**
 * POST /api/ai/stream/respond
 * Twilio webhook: receives user speech, streams AI response via WebSocket.
 * Returns TwiML to keep the Gather loop alive.
 */
export const handleStreamRespond = async (req: Request, res: Response): Promise<void> => {
  try {
    const callSid = req.body.CallSid as string;
    const speechResult = req.body.SpeechResult as string | undefined;
    const baseUrl = getTunnelUrl() || envConfig.BASE_URL;

    console.log(`[Stream Webhook] CallSid: ${callSid}, Speech: "${speechResult || '(empty)'}"`);

    const twiml = await handleStreamingSpeech(callSid, speechResult || null, baseUrl);
    res.status(200).type('text/xml').send(twiml);
  } catch (error) {
    console.error('[Stream Webhook Error]', error);
    res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-IN">I apologize, something went wrong. Please try again later. Goodbye!</Say>
  <Hangup/>
</Response>`);
  }
};

/**
 * POST /api/ai/stream/status
 * Twilio webhook: call status updates (completed, failed, etc.)
 */
export const handleStreamStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const callSid = req.body.CallSid as string;
    const callStatus = req.body.CallStatus as string;

    console.log(`[Stream Status] CallSid: ${callSid}, Status: ${callStatus}`);
    await handleStreamCallStatus(callSid, callStatus);

    res.status(200).type('text/xml').send('<Response/>');
  } catch (error) {
    console.error('[Stream Status Error]', error);
    res.status(200).type('text/xml').send('<Response/>');
  }
};

/**
 * GET /api/ai/stream/sessions
 * List all active streaming sessions (for debugging / UI).
 */
export const getStreamingSessions = async (_req: Request, res: Response): Promise<void> => {
  const sessions = getActiveStreamSessions();
  res.status(200).json({ success: true, data: sessions });
};
