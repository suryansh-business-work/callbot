/**
 * ─── Stream Orchestrator ────────────────────────────────────────────────────
 *
 * The central brain that coordinates all streaming components:
 *  - Manages per-call StreamSession lifecycle
 *  - Receives user speech (from Twilio webhook)
 *  - Plays instant filler audio
 *  - Kicks off parallel OpenAI streaming + sentence-by-sentence TTS
 *  - Streams TTS audio chunks back to Twilio in order
 *  - Handles barge-in (user interruption)
 *  - Emits live events to the UI via Socket.IO
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  ORCHESTRATION FLOW (per user turn):                                  │
 * │                                                                       │
 * │  1. User speech arrives (webhook)                                     │
 * │  2. IMMEDIATELY play filler audio (pre-cached) → ~200ms to earpiece  │
 * │  3. Start OpenAI stream (parallel, doesn't block filler playback)    │
 * │  4. Tokens flow into SentenceBuffer                                   │
 * │  5. Each complete sentence → fire TTS request (parallel)             │
 * │  6. TTS results queued by sentence index for ordered playback        │
 * │  7. As each TTS chunk arrives, stream to Twilio (with marks)         │
 * │  8. If user speaks again (barge-in) → abort OpenAI + clear audio    │
 * │  9. Emit all events to UI in real-time                               │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { StreamSession, getFillerPhrase } from './streaming.types';
import { SentenceBuffer } from './sentence.buffer';
import { streamChatCompletion } from './openai.stream';
import { preWarmFiller, sanitiseSpeaker } from './tts.stream';
import { generateAndCacheAudio } from '../tts/tts.services';
import { emitToCall, emitGlobal } from '../websocket';
import { VoiceOption } from '../calls/calls.models';
import CallLog from '../calllogs/calllogs.models';

// ─── Active sessions registry ───────────────────────────────────────────────

/** callSid → StreamSession */
const sessions = new Map<string, StreamSession>();

/** streamSid → callSid (reverse lookup) */
const streamToCall = new Map<string, string>();

/** callSid → pre-warmed filler audio base64 */
const fillerCache = new Map<string, string>();

// ─── Language helpers ───────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = {
  'en-IN': 'English', 'hi-IN': 'Hindi', 'bn-IN': 'Bengali',
  'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam', 'mr-IN': 'Marathi', 'gu-IN': 'Gujarati',
  'pa-IN': 'Punjabi', 'od-IN': 'Odia',
};

const getLanguageName = (code: string): string => LANGUAGE_NAMES[code] || code;

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_SILENCE = 3;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * Create a new streaming session when a call starts.
 * Pre-warms filler audio in the background.
 */
export const createStreamSession = async (
  callSid: string,
  streamSid: string,
  voice: VoiceOption,
  language: string = 'en-IN',
  systemPrompt: string = '',
  aiModel: string = 'gpt-4o-mini',
): Promise<StreamSession> => {
  const safeSpeaker = sanitiseSpeaker(voice);

  // Build the system prompt with language instruction
  const langInstruction = language && !language.startsWith('en')
    ? `\n\nIMPORTANT: You MUST respond ONLY in ${getLanguageName(language)} language. Do not use English unless the user explicitly asks for it.`
    : '';
  const fullPrompt = (systemPrompt || 'You are a helpful, friendly AI phone assistant. Keep your responses concise and conversational, suitable for a phone call. Respond in 1-3 sentences unless more detail is needed. Be warm, natural, and professional.') + langInstruction;

  const session: StreamSession = {
    callSid,
    streamSid,
    voice: safeSpeaker,
    language,
    aiModel,
    messages: [{ role: 'system', content: fullPrompt }],
    isProcessing: false,
    isAlive: true,
    silenceCount: 0,
    startedAt: new Date().toISOString(),
    pendingMarks: [],
    userInterrupted: false,
    abortController: null,
  };

  sessions.set(callSid, session);
  streamToCall.set(streamSid, callSid);

  // Pre-warm filler audio in the background (don't await)
  preWarmFiller(language, safeSpeaker).then((audio) => {
    if (audio) fillerCache.set(callSid, audio);
  }).catch(() => { /* non-critical */ });

  console.log(`[Orchestrator] Session created: callSid=${callSid}, stream=${streamSid}, voice=${safeSpeaker}, lang=${language}`);
  return session;
};

/**
 * Get a session by callSid.
 */
export const getStreamSession = (callSid: string): StreamSession | undefined =>
  sessions.get(callSid);

/**
 * Look up callSid from streamSid.
 */
export const getCallSidByStream = (streamSid: string): string | undefined =>
  streamToCall.get(streamSid);

/**
 * Destroy a streaming session and clean up all resources.
 */
export const destroySession = async (callSid: string): Promise<void> => {
  const session = sessions.get(callSid);
  if (!session) return;

  session.isAlive = false;

  // Abort any in-flight OpenAI stream
  if (session.abortController) {
    session.abortController.abort();
    session.abortController = null;
  }

  // Clean up registries
  streamToCall.delete(session.streamSid);
  fillerCache.delete(callSid);
  sessions.delete(callSid);

  console.log(`[Orchestrator] Session destroyed: ${callSid}`);
};

// ─── Core: Handle User Speech ───────────────────────────────────────────────

/**
 * Main entry point: called when Twilio webhook delivers user speech text.
 *
 * This is the heart of the streaming pipeline:
 *  1. Play filler instantly
 *  2. Stream OpenAI tokens
 *  3. Buffer into sentences
 *  4. TTS each sentence → stream audio to Twilio
 *
 * Returns TwiML with <Play> audio for the AI response + next <Gather>.
 * Uses the streaming pipeline internally:
 *   OpenAI stream → sentence buffer → parallel TTS → collect audio URLs.
 * This is synchronous from Twilio's perspective (returns complete TwiML).
 */
export const handleStreamingSpeech = async (
  callSid: string,
  speechResult: string | null,
  baseUrl: string,
): Promise<string> => {
  const session = sessions.get(callSid);
  if (!session || !session.isAlive) {
    // No session — return basic TwiML that redirects
    return buildGatherTwiml(baseUrl, 'en-IN');
  }

  const { voice, language, aiModel } = session;

  // ── Handle silence ──
  if (!speechResult || speechResult.trim() === '') {
    session.silenceCount++;

    emitToCall(callSid, 'conversation:update', {
      callSid,
      type: 'silence',
      content: `Silence detected (${session.silenceCount}/${MAX_SILENCE})`,
      timestamp: new Date().toISOString(),
    });

    if (session.silenceCount >= MAX_SILENCE) {
      // End call due to inactivity
      emitToCall(callSid, 'conversation:update', {
        callSid,
        type: 'call_ended',
        content: 'Call ended due to inactivity.',
        timestamp: new Date().toISOString(),
      });

      await destroySession(callSid);

      try {
        const goodbyeUrl = await generateAndCacheAudio(
          'I have not heard anything for a while. Thank you for calling. Goodbye!',
          language, voice
        );
        return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Play>${goodbyeUrl}</Play>\n  <Hangup/>\n</Response>`;
      } catch {
        return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say language="${language}">I have not heard anything. Goodbye!</Say>\n  <Hangup/>\n</Response>`;
      }
    }

    // Play "are you still there?"
    try {
      const stillThereUrl = await generateAndCacheAudio(
        'Are you still there? Please go ahead, I am listening.',
        language, voice
      );
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/ai/stream/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
    <Play>${stillThereUrl}</Play>
  </Gather>
  <Redirect>${baseUrl}/api/ai/stream/respond?timeout=true</Redirect>
</Response>`;
    } catch {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/ai/stream/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
    <Say language="${language}">Are you still there?</Say>
  </Gather>
  <Redirect>${baseUrl}/api/ai/stream/respond?timeout=true</Redirect>
</Response>`;
    }
  }

  // ── Reset silence counter on valid speech ──
  session.silenceCount = 0;

  // ── If already processing, abort previous stream (barge-in) ──
  if (session.isProcessing && session.abortController) {
    console.log(`[Orchestrator] Barge-in detected for ${callSid}`);
    session.abortController.abort();
    session.abortController = null;
    session.userInterrupted = true;
  }

  // ── Emit user message to UI ──
  emitToCall(callSid, 'conversation:update', {
    callSid,
    type: 'user_message',
    content: speechResult,
    timestamp: new Date().toISOString(),
  });

  // Add user message to conversation history
  session.messages.push({
    role: 'user',
    content: speechResult,
  });

  // ── Run the streaming AI pipeline (awaited) ──
  const audioUrls = await processAIResponse(session, baseUrl);

  // ── Build TwiML with <Play> for each audio chunk ──
  const playTags = audioUrls.length > 0
    ? audioUrls.map((url) => `  <Play>${url}</Play>`).join('\n')
    : `  <Say language="${language}">I apologize, I could not generate a response.</Say>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playTags}
  <Gather input="speech" action="${baseUrl}/api/ai/stream/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
  </Gather>
  <Redirect>${baseUrl}/api/ai/stream/respond?timeout=true</Redirect>
</Response>`;
};

// ─── AI Response Pipeline ───────────────────────────────────────────────────

/**
 * Internal: run the full streaming AI pipeline for a user turn.
 *
 * Coordinates:
 *   1. OpenAI streaming → tokens arrive immediately
 *   2. SentenceBuffer → emits complete sentences
 *   3. Parallel TTS per sentence → concurrent audio generation
 *   4. Collect audio URLs in order → return for TwiML <Play>
 *
 * Returns an array of audio URLs (one per sentence, in order).
 */
const processAIResponse = async (
  session: StreamSession,
  baseUrl: string,
): Promise<string[]> => {
  const { callSid, voice, language, aiModel } = session;

  session.isProcessing = true;
  session.userInterrupted = false;
  session.abortController = new AbortController();

  // Emit "thinking" to UI
  emitToCall(callSid, 'conversation:update', {
    callSid,
    type: 'ai_thinking',
    content: 'AI is generating a response...',
    timestamp: new Date().toISOString(),
  });

  /**
   * Collect TTS promises in sentence order.
   * Each promise resolves to an audio URL (from generateAndCacheAudio).
   */
  const ttsPromises: Array<{ index: number; promise: Promise<string | null> }> = [];
  let fullAiText = '';
  let streamDone = false;

  // ── Set up the sentence buffer ──
  const sentenceBuffer = new SentenceBuffer(
    // onSentence: fire TTS for each completed sentence (parallel)
    (sentence, index) => {
      if (!session.isAlive || session.userInterrupted) return;

      console.log(`[Orchestrator] Sentence ${index}: "${sentence.slice(0, 60)}..."`);

      // Fire TTS request in parallel — collect the promise
      const promise = generateAndCacheAudio(sentence, language, voice)
        .catch((err) => {
          console.error(`[Orchestrator] TTS failed for sentence ${index}:`, err);
          return null; // Skip this sentence
        });

      ttsPromises.push({ index, promise });
    },

    // onDone: all tokens received, flush remaining
    (text) => {
      streamDone = true;
      fullAiText = text;
    },
  );

  // ── Stream OpenAI tokens ──
  try {
    await streamChatCompletion({
      messages: session.messages,
      model: aiModel,
      onToken: (token) => sentenceBuffer.push(token),
      onDone: (text) => {
        sentenceBuffer.flush();
        fullAiText = text;
        streamDone = true;
      },
      onError: (err) => {
        console.error(`[Orchestrator] OpenAI error:`, err);
        sentenceBuffer.push('I apologize, I am having trouble right now.');
        sentenceBuffer.flush();
      },
      signal: session.abortController?.signal,
    });
  } catch (err) {
    console.error(`[Orchestrator] Stream error:`, err);
    // If stream completely failed, push a fallback sentence
    if (ttsPromises.length === 0) {
      const fallbackPromise = generateAndCacheAudio(
        'I apologize, I could not process that. Could you please repeat?',
        language, voice,
      ).catch(() => null);
      ttsPromises.push({ index: 0, promise: fallbackPromise });
    }
  }

  // ── Await all TTS requests and collect URLs in order ──
  // Sort by index to maintain sentence order
  ttsPromises.sort((a, b) => a.index - b.index);

  const audioUrls: string[] = [];
  for (const { promise } of ttsPromises) {
    const url = await promise;
    if (url) audioUrls.push(url);
  }

  // ── Record AI response in conversation history ──
  if (fullAiText.trim()) {
    session.messages.push({
      role: 'assistant',
      content: fullAiText,
    });

    // Emit full AI message to UI
    emitToCall(callSid, 'conversation:update', {
      callSid,
      type: 'ai_message',
      content: fullAiText,
      timestamp: new Date().toISOString(),
    });
  }

  session.isProcessing = false;
  session.abortController = null;

  return audioUrls;
};

// ─── Handle Call Status (forward from existing webhooks) ────────────────────

/**
 * Handle call status updates for streaming sessions.
 * Saves conversation to DB and cleans up.
 */
export const handleStreamCallStatus = async (
  callSid: string,
  status: string,
): Promise<void> => {
  console.log(`[Orchestrator] Call ${callSid} status: ${status}`);

  if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(status)) {
    const session = sessions.get(callSid);

    emitToCall(callSid, 'conversation:update', {
      callSid,
      type: 'call_ended',
      content: `Call ${status}.`,
      timestamp: new Date().toISOString(),
    });

    // Save conversation messages to DB
    try {
      const updateData: Record<string, unknown> = { status };
      if (session) {
        updateData.conversationMessages = session.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date().toISOString(),
          }));
      }
      await CallLog.findOneAndUpdate({ callSid }, updateData);
    } catch (err) {
      console.error(`[Orchestrator] Failed to update call log for ${callSid}:`, err);
    }

    // Emit transcript to UI
    if (session) {
      emitToCall(callSid, 'conversation:transcript', {
        callSid,
        messages: session.messages.filter((m) => m.role !== 'system'),
      });
    }

    emitGlobal('calllog:updated', { callSid, status });

    await destroySession(callSid);
  }
};

// ─── Handle Mark Events ─────────────────────────────────────────────────────

/**
 * Called when Twilio confirms a mark has been reached in playback.
 * Used to track playback progress and detect when all audio is done.
 */
export const handleMarkEvent = (streamSid: string, markName: string): void => {
  const callSid = streamToCall.get(streamSid);
  if (!callSid) return;

  const session = sessions.get(callSid);
  if (!session) return;

  // Remove from pending marks
  const idx = session.pendingMarks.indexOf(markName);
  if (idx !== -1) {
    session.pendingMarks.splice(idx, 1);
  }

  console.log(`[Orchestrator] Mark completed: ${markName}, pending: ${session.pendingMarks.length}`);
};

// ─── Handle Stream End ──────────────────────────────────────────────────────

/**
 * Called when the Twilio WebSocket stream ends.
 */
export const handleStreamEnd = async (streamSid: string): Promise<void> => {
  const callSid = streamToCall.get(streamSid);
  if (!callSid) return;

  console.log(`[Orchestrator] Stream ended for ${callSid}`);
  // Don't destroy session here — wait for status webhook
  // The call might still be active (stream can restart)
};

// ─── Utility: get all active streaming sessions ─────────────────────────────

export const getActiveStreamSessions = (): Array<{
  callSid: string;
  voice: string;
  language: string;
  startedAt: string;
  messageCount: number;
}> => {
  return Array.from(sessions.values()).map((s) => ({
    callSid: s.callSid,
    voice: s.voice,
    language: s.language,
    startedAt: s.startedAt,
    messageCount: s.messages.filter((m) => m.role !== 'system').length,
  }));
};

// ─── TwiML Helper ───────────────────────────────────────────────────────────

/**
 * Build TwiML that keeps the <Gather> loop going.
 */
const buildGatherTwiml = (baseUrl: string, language: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/ai/stream/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
  </Gather>
  <Redirect>${baseUrl}/api/ai/stream/respond?timeout=true</Redirect>
</Response>`;
};

// ─── Periodic cleanup ───────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [callSid, session] of sessions.entries()) {
    if (now - new Date(session.startedAt).getTime() > SESSION_TTL_MS) {
      console.log(`[Orchestrator] Cleaning stale session: ${callSid}`);
      destroySession(callSid);
    }
  }
}, 5 * 60 * 1000);
