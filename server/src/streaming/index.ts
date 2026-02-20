/**
 * ─── Streaming Module — Barrel Export ────────────────────────────────────────
 *
 * Streaming AI response pipeline for faster call responses.
 * Uses OpenAI streaming + sentence buffering + parallel TTS
 * for <1.5 s perceived latency on AI call responses.
 *
 * Note: This does NOT use Twilio Media Streams (bidirectional WS).
 * The TwiML structure is standard <Gather> + <Play>.
 * The speed improvement is purely server-side.
 */

// Public orchestrator API
export {
  createStreamSession,
  handleStreamingSpeech,
  handleStreamCallStatus,
  handleMarkEvent,
  handleStreamEnd,
  destroySession,
  getActiveStreamSessions,
} from './stream.orchestrator';

// Services
export { initiateStreamingCall } from './streaming.services';

// Routes
export { default as streamingRoutes } from './streaming.routes';

// Types
export type {
  StreamSession,
  OpenAIStreamOptions,
} from './streaming.types';

export { FILLER_PHRASES, getFillerPhrase } from './streaming.types';

// Sub-modules (for advanced usage)
export { SentenceBuffer } from './sentence.buffer';
export { streamChatCompletion } from './openai.stream';
export { generateSentenceAudio, preWarmFiller } from './tts.stream';
