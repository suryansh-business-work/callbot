/* ─── Shared voice catalogue — Sarvam.ai Bulbul v3 ──────────────── */

export interface VoiceEntry {
  /** Speaker name sent to Sarvam.ai TTS */
  id: string;
  /** Human-readable name */
  name: string;
  /** Descriptive tags */
  tags: string[];
  /** Primary language labels */
  languages: string[];
  /** Gender label */
  gender: 'feminine' | 'masculine';
  /** BCP-47 language code */
  languageCode: string;
}

/* ─── Sarvam.ai Bulbul v3 speakers ───────────────────────────── */
export const SARVAM_VOICES: VoiceEntry[] = [
  { id: 'shubh', name: 'Shubh', gender: 'masculine', tags: ['natural', 'default'], languages: ['all'], languageCode: 'hi-IN' },
  { id: 'aditya', name: 'Aditya', gender: 'masculine', tags: ['deep', 'professional'], languages: ['all'], languageCode: 'hi-IN' },
  { id: 'rahul', name: 'Rahul', gender: 'masculine', tags: ['friendly', 'conversational'], languages: ['all'], languageCode: 'hi-IN' },
];

/* ─── All voices combined ──────────────────────────────────────── */
export const ALL_VOICES: VoiceEntry[] = [...SARVAM_VOICES];

/* ─── Supported languages (Sarvam.ai Bulbul v3) ──────────────── */
export interface LanguageEntry {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageEntry[] = [
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'bn-IN', label: 'Bengali', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', label: 'Malayalam', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'Marathi', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'Gujarati', flag: '🇮🇳' },
  { code: 'pa-IN', label: 'Punjabi', flag: '🇮🇳' },
  { code: 'od-IN', label: 'Odia', flag: '🇮🇳' },
];

/* ─── Provider metadata ───────────────────────────────────────── */
export const VOICE_PROVIDERS = [
  { id: 'sarvam', label: 'Sarvam.ai' },
];

/* ─── Helpers ──────────────────────────────────────────────────── */
export const getVoiceById = (id: string): VoiceEntry | undefined =>
  ALL_VOICES.find((v) => v.id === id);

export const getVoiceLabel = (id: string): string => {
  const v = getVoiceById(id);
  return v ? v.name : id || 'None Selected';
};

/** Get the language code for a voice (for TwiML language attribute) */
export const getVoiceLanguageCode = (voiceId: string): string => {
  const v = getVoiceById(voiceId);
  return v?.languageCode || 'en-IN';
};

/** 
 * Sarvam.ai voices are multilingual — all speakers support all 11 languages.
 * So we return ALL voices regardless of language code.
 */
export const getVoicesByLanguage = (_languageCode: string): VoiceEntry[] =>
  ALL_VOICES;
