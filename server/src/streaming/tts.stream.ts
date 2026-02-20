/**
 * ─── Streaming TTS Service ──────────────────────────────────────────────────
 *
 * Generates TTS audio for individual sentences and returns base64-encoded
 * mulaw audio suitable for streaming directly into a Twilio Media Stream.
 *
 * Key features:
 *  - Per-sentence TTS: called as soon as a sentence completes
 *  - Pre-warmed filler cache: common filler phrases are pre-generated at
 *    session start so they can be played with zero latency
 *  - Content-hash dedup: identical sentences share cached audio
 *  - Non-blocking: callers fire-and-forget, results delivered via callback
 *
 * Audio format: mulaw, 8000 Hz, mono — matches Twilio Media Stream format
 */

import { envConfig } from '../config';
import crypto from 'crypto';
import { TTSChunk, getFillerPhrase } from './streaming.types';

// ─── Configuration ──────────────────────────────────────────────────────────

const SARVAM_API_URL = 'https://api.sarvam.ai/text-to-speech';
const TTS_TIMEOUT_MS = 12_000;   // 12s timeout per TTS call
const TTS_MAX_RETRIES = 2;       // retry once on transient failure

const VALID_SPEAKERS = new Set([
  'shubh', 'aditya', 'rahul', 'anushka', 'meera', 'sarthak',
  'arjun', 'amol', 'maitreyi', 'amartya', 'arvind',
]);
const DEFAULT_SPEAKER = 'meera';

// ─── In-memory TTS cache (content-hash → base64 mulaw) ─────────────────────

interface CachedTTS {
  audioBase64: string;
  createdAt: number;
}

const ttsCache = new Map<string, CachedTTS>();
const TTS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

const getCacheKey = (text: string, speaker: string, lang: string): string =>
  crypto.createHash('md5').update(`stream|${text}|${speaker}|${lang}`).digest('hex');

// ─── Speaker sanitization ───────────────────────────────────────────────────

export const sanitiseSpeaker = (speaker: string): string =>
  VALID_SPEAKERS.has(speaker.toLowerCase())
    ? speaker.toLowerCase()
    : DEFAULT_SPEAKER;

// ─── Fetch with timeout ─────────────────────────────────────────────────────

const fetchWithTimeout = (url: string, init: RequestInit, timeoutMs = TTS_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

// ─── Core TTS generation ────────────────────────────────────────────────────

/**
 * Generate mulaw audio from text via Sarvam.ai.
 * Returns base64-encoded mulaw audio string.
 *
 * Includes retry logic for transient failures (timeout, 5xx).
 */
export const generateSentenceAudio = async (
  text: string,
  language: string = 'en-IN',
  speaker: string = DEFAULT_SPEAKER,
): Promise<string> => {
  const apiKey = envConfig.SARVAM_API_KEY;
  if (!apiKey) throw new Error('SARVAM_API_KEY is not configured');

  const safeSpeaker = sanitiseSpeaker(speaker);

  // Check cache first
  const cacheKey = getCacheKey(text, safeSpeaker, language);
  const cached = ttsCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < TTS_CACHE_TTL_MS) {
    return cached.audioBase64;
  }

  // Sarvam limit: 2500 chars
  const truncated = text.slice(0, 2400);

  const payload = JSON.stringify({
    text: truncated,
    target_language_code: language,
    speaker: safeSpeaker,
    model: 'bulbul:v3',
    pace: 1.05,       // Slightly faster for responsiveness
    speech_sample_rate: 8000,
    output_audio_codec: 'mulaw',
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= TTS_MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(SARVAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: payload,
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`[StreamTTS] Sarvam error (attempt ${attempt}): ${response.status}`, body);
        lastError = new Error(`Sarvam TTS ${response.status}`);
        if (response.status < 500) throw lastError; // Don't retry 4xx
        continue;
      }

      const data = (await response.json()) as { audios: string[] };
      if (!data.audios?.length) throw new Error('No audio returned');

      const audioBase64 = data.audios[0];

      // Cache for future reuse
      ttsCache.set(cacheKey, { audioBase64, createdAt: Date.now() });

      return audioBase64;
    } catch (err: unknown) {
      lastError = err;
      const isTimeout = err instanceof Error &&
        (err.name === 'AbortError' || err.message.includes('aborted'));

      if (!isTimeout || attempt === TTS_MAX_RETRIES) {
        throw lastError;
      }

      const backoff = attempt * 800;
      console.warn(`[StreamTTS] Attempt ${attempt} timeout, retry in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw lastError;
};

// ─── Sentence-to-TTS pipeline ───────────────────────────────────────────────

/**
 * Convert a sentence to a TTSChunk (text + audio).
 * Non-blocking: meant to be called fire-and-forget per sentence.
 */
export const sentenceToAudio = async (
  text: string,
  index: number,
  language: string,
  speaker: string,
): Promise<TTSChunk> => {
  const startMs = Date.now();
  const audioBase64 = await generateSentenceAudio(text, language, speaker);
  const elapsed = Date.now() - startMs;
  console.log(`[StreamTTS] Sentence ${index} (${text.length} chars) → TTS in ${elapsed}ms`);

  return { index, text, audioBase64 };
};

// ─── Filler audio pre-warming ───────────────────────────────────────────────

/**
 * Pre-generate filler audio for a language+speaker combination.
 * Call at session start so filler plays with zero latency.
 * Returns the base64 mulaw audio.
 */
export const preWarmFiller = async (
  language: string,
  speaker: string,
): Promise<string> => {
  const phrase = getFillerPhrase(language);
  try {
    const audio = await generateSentenceAudio(phrase, language, speaker);
    console.log(`[StreamTTS] Filler pre-warmed: "${phrase}"`);
    return audio;
  } catch (err) {
    console.warn('[StreamTTS] Filler pre-warm failed:', err);
    // Return empty — orchestrator will skip filler if unavailable
    return '';
  }
};

// ─── Cache cleanup ──────────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ttsCache.entries()) {
    if (now - entry.createdAt > TTS_CACHE_TTL_MS) {
      ttsCache.delete(key);
    }
  }
}, 3 * 60 * 1000);
