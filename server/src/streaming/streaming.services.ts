/**
 * ─── Streaming Services ─────────────────────────────────────────────────────
 *
 * High-level service for initiating streaming AI calls.
 *
 * The "streaming" advantage is NOT Twilio Media Streams (bidirectional WS)
 * but rather a faster server-side response pipeline:
 *   1. OpenAI streaming (tokens arrive immediately, not after full completion)
 *   2. Sentence buffer (TTS starts on first complete sentence)
 *   3. Parallel TTS requests (concurrent audio generation per sentence)
 *   4. Filler audio (instant response while AI thinks)
 *
 * The TwiML structure is identical to the regular AI call (<Gather> for STT).
 * The speed improvement happens inside the /respond webhook handler, which
 * uses the streaming orchestrator instead of the sequential pipeline.
 */

import twilio from 'twilio';
import { envConfig } from '../config';
import { getTunnelUrl } from '../tunnel';
import { generateAndCacheAudio } from '../tts/tts.services';
import CallLog from '../calllogs/calllogs.models';
import { emitToCall } from '../websocket';
import { VoiceOption } from '../calls/calls.models';
import { createStreamSession } from './stream.orchestrator';

// ─── Lazy Twilio client ─────────────────────────────────────────────────────

let twilioClient: ReturnType<typeof twilio> | null = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    if (!envConfig.TWILIO_ACCOUNT_SID || !envConfig.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are not configured');
    }
    twilioClient = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

/** Returns the tunnel URL if available, else falls back to env BASE_URL. */
const getWebhookBaseUrl = (): string => getTunnelUrl() || envConfig.BASE_URL;

// ─── Initiate Streaming Call ────────────────────────────────────────────────

/**
 * Initiate an AI call that uses the streaming response pipeline.
 *
 * TwiML flow (same pattern as regular AI calls):
 *  1. <Play> opening message (pre-generated TTS)
 *  2. <Gather> for STT — speech result → POST /api/ai/stream/respond
 *  3. Respond webhook uses streaming OpenAI + sentence TTS pipeline
 *  4. Returns TwiML with concatenated <Play> audio + next <Gather>
 */
export const initiateStreamingCall = async (
  to: string,
  message: string,
  voice: VoiceOption,
  systemPrompt?: string,
  agentId?: string,
  userId?: string,
  language: string = 'en-IN',
  aiModel?: string,
) => {
  let baseUrl = getWebhookBaseUrl();

  // Retry tunnel if it's not ready
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    await new Promise((r) => setTimeout(r, 2000));
    baseUrl = getWebhookBaseUrl();
  }

  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    throw new Error(
      'Streaming calls require a public URL. Ensure cloudflared is installed or set BASE_URL.'
    );
  }

  const client = getTwilioClient();

  // ── Generate opening message audio (same as regular AI call) ──
  let twiml: string;
  try {
    const [messageAudioUrl, listeningAudioUrl] = await Promise.all([
      generateAndCacheAudio(message, language, voice),
      generateAndCacheAudio('I am listening.', language, voice),
    ]);

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${messageAudioUrl}</Play>
  <Gather input="speech" action="${baseUrl}/api/ai/stream/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
    <Play>${listeningAudioUrl}</Play>
  </Gather>
  <Redirect>${baseUrl}/api/ai/stream/respond?timeout=true</Redirect>
</Response>`;
  } catch (ttsErr) {
    console.error('[StreamService] TTS failed for opening, using <Say>:', ttsErr);
    const safeMsg = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${language}">${safeMsg}</Say>
  <Gather input="speech" action="${baseUrl}/api/ai/stream/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
    <Say language="${language}">I am listening.</Say>
  </Gather>
  <Redirect>${baseUrl}/api/ai/stream/respond?timeout=true</Redirect>
</Response>`;
  }

  // ── Make the Twilio call ──
  const call = await client.calls.create({
    to,
    from: envConfig.TWILIO_PHONE_NUMBER,
    twiml,
    record: true,
    recordingChannels: 'dual',
    recordingStatusCallback: `${baseUrl}/api/calls/webhooks/recording-status`,
    recordingStatusCallbackEvent: ['completed'],
    statusCallback: `${baseUrl}/api/ai/stream/status`,
    statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
  });

  // ── Save call log ──
  await CallLog.create({
    callSid: call.sid,
    agentId: agentId || null,
    userId: userId || null,
    from: call.from,
    to: call.to,
    status: call.status,
    direction: call.direction || 'outbound-api',
    startTime: (call.dateCreated || new Date()).toISOString(),
    language,
    voice,
  });

  // ── Create streaming session for /respond webhook to use ──
  // streamSid is empty because we're not using Twilio Media Streams;
  // the session holds conversation state for the streaming AI pipeline.
  await createStreamSession(call.sid, '', voice, language, systemPrompt, aiModel);

  // ── Emit opening message to UI ──
  emitToCall(call.sid, 'conversation:update', {
    callSid: call.sid,
    type: 'ai_message',
    content: message,
    timestamp: new Date().toISOString(),
  });

  console.log(`[StreamService] Streaming call initiated: ${call.sid} → ${to}`);

  return {
    success: true,
    message: 'Streaming AI call initiated successfully',
    data: {
      callSid: call.sid,
      status: call.status,
      from: call.from,
      to: call.to,
      dateCreated: call.dateCreated?.toISOString() || new Date().toISOString(),
    },
  };
};
