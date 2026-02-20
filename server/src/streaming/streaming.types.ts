/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                    REAL-TIME STREAMING ARCHITECTURE                        │
 * │                                                                           │
 * │  ┌──────────┐  mulaw   ┌──────────────┐  text   ┌─────────────┐          │
 * │  │  Twilio   │ ──────► │  STT (Google  │ ─────► │   Sentence   │          │
 * │  │  Media    │  audio   │  via Twilio)  │        │   Buffer     │          │
 * │  │  Stream   │         └──────────────┘         └──────┬──────┘          │
 * │  │  (WS)     │                                          │                 │
 * │  │           │         ┌──────────────┐                │                 │
 * │  │           │ ◄────── │   TTS Audio   │ ◄─────────────┘                 │
 * │  │           │  mulaw  │   Chunks      │         ┌─────────────┐          │
 * │  └──────────┘         └──────┬───────┘         │   OpenAI     │          │
 * │                               │                 │   Stream     │          │
 * │                               │                 │  (SSE)       │          │
 * │                      ┌────────┴───────┐         └──────┬──────┘          │
 * │                      │   Sarvam TTS   │                │                 │
 * │                      │   (per-sentence)│ ◄─────────────┘                 │
 * │                      └────────────────┘   sentence-by-sentence           │
 * │                                                                           │
 * │  FLOW:                                                                    │
 * │  1. Twilio sends user audio via WebSocket (Media Stream)                 │
 * │  2. Twilio handles STT internally via <Gather>/<Connect><Stream>         │
 * │  3. User speech text → OpenAI streaming (token by token)                 │
 * │  4. SentenceBuffer accumulates tokens, emits complete sentences          │
 * │  5. Each sentence → Sarvam TTS (parallel, non-blocking)                 │
 * │  6. TTS audio (mulaw) → base64 → sent to Twilio via WS "media" msg     │
 * │  7. Filler audio plays instantly while AI processes                       │
 * │                                                                           │
 * │  LATENCY TARGET: < 1.5s first audio (filler), < 3s first AI sentence    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { VoiceOption } from '../calls/calls.models';

// ─── Twilio Media Stream Protocol Types ─────────────────────────────────────

/** Twilio WebSocket "connected" event — sent once when stream connects */
export interface TwilioConnectedEvent {
  event: 'connected';
  protocol: string;
  version: string;
}

/** Twilio WebSocket "start" event — contains stream metadata */
export interface TwilioStartEvent {
  event: 'start';
  sequenceNumber: string;
  start: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: 'audio/x-mulaw';
      sampleRate: number;  // 8000
      channels: number;    // 1
    };
    customParameters: Record<string, string>;
  };
  streamSid: string;
}

/** Twilio WebSocket "media" event — contains audio payload */
export interface TwilioMediaEvent {
  event: 'media';
  sequenceNumber: string;
  media: {
    track: 'inbound' | 'outbound';
    chunk: string;
    timestamp: string;
    payload: string; // base64 encoded mulaw audio
  };
  streamSid: string;
}

/** Twilio WebSocket "mark" event — sent when a mark is reached during playback */
export interface TwilioMarkEvent {
  event: 'mark';
  sequenceNumber: string;
  mark: {
    name: string;
  };
  streamSid: string;
}

/** Twilio WebSocket "stop" event — stream is ending */
export interface TwilioStopEvent {
  event: 'stop';
  sequenceNumber: string;
  stop: {
    accountSid: string;
    callSid: string;
  };
  streamSid: string;
}

/** Union type for all Twilio WebSocket events */
export type TwilioStreamEvent =
  | TwilioConnectedEvent
  | TwilioStartEvent
  | TwilioMediaEvent
  | TwilioMarkEvent
  | TwilioStopEvent;

// ─── Outbound messages we send to Twilio ────────────────────────────────────

/** Send audio to Twilio via the WebSocket */
export interface TwilioMediaMessage {
  event: 'media';
  streamSid: string;
  media: {
    payload: string; // base64 mulaw audio
  };
}

/** Insert a "mark" into the audio output queue — Twilio fires a mark event once playback reaches it */
export interface TwilioMarkMessage {
  event: 'mark';
  streamSid: string;
  mark: {
    name: string;
  };
}

/** Clear the Twilio media queue (for barge-in / interruption support) */
export interface TwilioClearMessage {
  event: 'clear';
  streamSid: string;
}

// ─── Streaming Session State ────────────────────────────────────────────────

/** Per-call streaming session, tracks all state for one active call */
export interface StreamSession {
  /** Twilio call SID */
  callSid: string;
  /** Twilio stream SID (assigned in "start" event) */
  streamSid: string;
  /** Voice speaker ID for TTS */
  voice: VoiceOption;
  /** Language code (e.g. 'hi-IN') */
  language: string;
  /** AI model to use */
  aiModel: string;
  /** Conversation messages for OpenAI context */
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  /** Whether AI is currently generating a response */
  isProcessing: boolean;
  /** Whether the session is still alive */
  isAlive: boolean;
  /** Consecutive silence count */
  silenceCount: number;
  /** Timestamp of session creation */
  startedAt: string;
  /** Queue of mark names pending acknowledgement */
  pendingMarks: string[];
  /** Whether user interrupted (barge-in) while AI is speaking */
  userInterrupted: boolean;
  /** Abort controller for current OpenAI stream */
  abortController: AbortController | null;
}

// ─── Sentence Buffer Types ──────────────────────────────────────────────────

/** Callback fired when a complete sentence is detected */
export type SentenceCallback = (sentence: string, index: number) => void;

/** Callback fired when the entire LLM stream is done */
export type StreamDoneCallback = (fullText: string) => void;

// ─── OpenAI Streaming Types ─────────────────────────────────────────────────

export interface OpenAIStreamOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model: string;
  /** Called for each token/chunk */
  onToken: (token: string) => void;
  /** Called when streaming is complete */
  onDone: (fullText: string) => void;
  /** Called on error */
  onError: (error: Error) => void;
  /** AbortSignal to cancel the stream */
  signal?: AbortSignal;
}

// ─── TTS Streaming Types ────────────────────────────────────────────────────

export interface TTSChunk {
  /** Sentence index (order in the LLM response) */
  index: number;
  /** The text that was converted */
  text: string;
  /** Base64-encoded mulaw audio */
  audioBase64: string;
}

// ─── Filler Phrases ─────────────────────────────────────────────────────────

/** Pre-defined filler phrases by language for instant playback */
export const FILLER_PHRASES: Record<string, string[]> = {
  'hi-IN': [
    'Ji ek second, main check karta hoon.',
    'Bilkul, dekhta hoon abhi.',
    'Haan ji, ruko zara.',
  ],
  'en-IN': [
    'Just a moment, let me check.',
    'Sure, one second please.',
    'Let me look into that.',
  ],
  'bn-IN': ['Ek minute, dekhchi.'],
  'ta-IN': ['Oru nimisham, paarkiren.'],
  'te-IN': ['Oka nimisham, chustunna.'],
  'mr-IN': ['Ek second, baghtoy.'],
  'gu-IN': ['Ek second, joi lau.'],
  'kn-IN': ['Ond second, nodtini.'],
  'ml-IN': ['Oru nimisham, nokkatte.'],
  'pa-IN': ['Ik second, dekh raha haan.'],
  'od-IN': ['Ata thare, dekhuchi.'],
};

/** Get a random filler phrase for a language */
export const getFillerPhrase = (language: string): string => {
  const phrases = FILLER_PHRASES[language] || FILLER_PHRASES['en-IN'];
  return phrases[Math.floor(Math.random() * phrases.length)];
};
