import { envConfig } from '../config';
import { getTunnelUrl } from '../tunnel';
import crypto from 'crypto';
import OpenAI from 'openai';

// ─── In-memory audio cache ──────────────────────────────────────────────────
interface CachedAudio {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const audioCache = new Map<string, CachedAudio>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

// ─── Preview cache (base64 strings keyed by speaker+text hash) ──────────────
const previewCache = new Map<string, { audio: string; createdAt: number }>();
const PREVIEW_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — previews are static

const getPreviewCacheKey = (speaker: string, text: string, lang: string): string =>
  crypto.createHash('md5').update(`${speaker}|${text}|${lang}`).digest('hex');

// ─── Sarvam.ai TTS API ─────────────────────────────────────────────────────

const SARVAM_API_URL = 'https://api.sarvam.ai/text-to-speech';
const TTS_TIMEOUT_MS = 8000; // 8 s max per Sarvam call

/**
 * Internal fetch wrapper with timeout.
 */
const fetchWithTimeout = (url: string, init: RequestInit, timeoutMs = TTS_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const existingSignal = init.signal;

  // Combine external signal (abort on client disconnect) with our timeout
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (existingSignal) {
    existingSignal.addEventListener('abort', () => controller.abort());
  }

  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

/**
 * Convert text to speech using Sarvam.ai Bulbul v3.
 * Returns a Buffer of mulaw audio for Twilio <Play>.
 */
export const generateSpeech = async (
  text: string,
  targetLanguageCode: string = 'en-IN',
  speaker: string = 'meera',
  pace: number = 1.0
): Promise<Buffer> => {
  const apiKey = envConfig.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured in .env');
  }

  // Sarvam.ai supports max 2500 chars for bulbul:v3
  const truncatedText = text.slice(0, 2400);

  const response = await fetchWithTimeout(SARVAM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      text: truncatedText,
      target_language_code: targetLanguageCode,
      speaker,
      model: 'bulbul:v3',
      pace,
      speech_sample_rate: 8000,
      output_audio_codec: 'mulaw',
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Sarvam TTS] API error:', response.status, errBody);
    throw new Error(`Sarvam TTS API error: ${response.status}`);
  }

  const data = (await response.json()) as { request_id: string; audios: string[] };

  if (!data.audios || data.audios.length === 0) {
    throw new Error('Sarvam TTS returned no audio');
  }

  return Buffer.from(data.audios[0], 'base64');
};

/**
 * Generate TTS audio, cache it, and return a publicly accessible URL
 * that Twilio can <Play>.
 *
 * Deduplicates by text+speaker+lang so identical phrases (e.g. "Goodbye!")
 * aren't re-generated for every call — the cached URL is reused until TTL.
 */

// content-hash → cached audio id (for dedup of identical phrases)
const contentHashToId = new Map<string, { id: string; createdAt: number }>();

export const generateAndCacheAudio = async (
  text: string,
  languageCode: string,
  speaker: string,
  pace: number = 1.0
): Promise<string> => {
  const baseUrl = getTunnelUrl() || envConfig.BASE_URL;

  // Dedup check — same text+speaker+lang already cached?
  const contentKey = crypto.createHash('md5').update(`${text}|${speaker}|${languageCode}|${pace}`).digest('hex');
  const existing = contentHashToId.get(contentKey);
  if (existing && audioCache.has(existing.id) && Date.now() - existing.createdAt < CACHE_TTL_MS) {
    return `${baseUrl}/api/tts/audio/${existing.id}`;
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const buffer = await generateSpeech(text, languageCode, speaker, pace);

  audioCache.set(id, {
    buffer,
    contentType: 'audio/basic', // mulaw
    createdAt: Date.now(),
  });

  contentHashToId.set(contentKey, { id, createdAt: Date.now() });
  return `${baseUrl}/api/tts/audio/${id}`;
};

/**
 * Generate a preview-quality TTS clip for the UI voice sample player.
 * Uses WAV codec at 22050 Hz (browser-friendly, not Twilio mulaw).
 * Results are cached by speaker+text+lang so repeated clicks are instant.
 */
export const generatePreviewSpeech = async (
  speaker: string,
  text: string = 'Hello, how can I help you today?',
  languageCode: string = 'en-IN',
  signal?: AbortSignal
): Promise<string> => {
  // Check cache first — same speaker + same text = same audio
  const cacheKey = getPreviewCacheKey(speaker, text, languageCode);
  const cached = previewCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < PREVIEW_CACHE_TTL_MS) {
    return cached.audio;
  }

  const apiKey = envConfig.SARVAM_API_KEY;
  if (!apiKey) throw new Error('SARVAM_API_KEY is not configured');

  const response = await fetchWithTimeout(
    SARVAM_API_URL,
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 500),
        target_language_code: languageCode,
        speaker,
        model: 'bulbul:v3',
        pace: 1.0,
        speech_sample_rate: 22050,
        output_audio_codec: 'wav',
      }),
    },
    12000 // preview can be a bit longer since user waits
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.error('[Sarvam TTS Preview] API error:', response.status, errBody);
    throw new Error(`Sarvam TTS preview error: ${response.status}`);
  }

  const data = (await response.json()) as { request_id: string; audios: string[] };
  if (!data.audios?.length) throw new Error('No preview audio returned');

  const audio = data.audios[0];
  previewCache.set(cacheKey, { audio, createdAt: Date.now() });
  return audio;
};

/**
 * Retrieve cached audio by ID.
 */
export const getCachedAudio = (id: string): CachedAudio | undefined => {
  return audioCache.get(id);
};

/**
 * Generate OpenAI TTS preview audio.
 * Returns base64-encoded mp3 audio.
 */
export const generateOpenAiPreview = async (
  voiceId: string,
  text: string = 'Hello, how can I help you today?',
  signal?: AbortSignal
): Promise<string> => {
  const voice = voiceId.replace('openai-', '') as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'ash' | 'coral' | 'sage';

  // Early abort check
  if (signal?.aborted) {
    const err = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    throw err;
  }

  const cacheKey = getPreviewCacheKey(voice, text, 'openai');
  const cached = previewCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < PREVIEW_CACHE_TTL_MS) {
    return cached.audio;
  }

  if (!envConfig.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

  const openai = new OpenAI({ apiKey: envConfig.OPENAI_API_KEY });

  try {
    const mp3 = await openai.audio.speech.create(
      { model: 'tts-1', voice, input: text.slice(0, 500) },
      signal ? { signal } : undefined
    );

    if (signal?.aborted) {
      throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
    }

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString('base64');

    previewCache.set(cacheKey, { audio: base64, createdAt: Date.now() });
    return base64;
  } catch (err: unknown) {
    // If request was aborted during the API call, normalize the error
    if (signal?.aborted) {
      throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
    }
    throw err;
  }
};

// ─── Periodic cleanup ───────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of audioCache.entries()) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      audioCache.delete(id);
    }
  }
  for (const [key, entry] of previewCache.entries()) {
    if (now - entry.createdAt > PREVIEW_CACHE_TTL_MS) {
      previewCache.delete(key);
    }
  }
}, 2 * 60 * 1000);
