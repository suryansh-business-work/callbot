export interface CallConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
}

export interface AiConfig {
  openaiApiKey: string;
}

export interface TtsConfig {
  sarvamApiKey: string;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

export interface SettingsData {
  _id: string;
  userId: string;
  useGlobalConfig: boolean;
  callConfig: CallConfig;
  aiConfig: AiConfig;
  ttsConfig: TtsConfig;
  emailConfig: EmailConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  success: boolean;
  data: SettingsData;
}

export interface UpdateSettingsPayload {
  useGlobalConfig?: boolean;
  callConfig?: Partial<CallConfig>;
  aiConfig?: Partial<AiConfig>;
  ttsConfig?: Partial<TtsConfig>;
  emailConfig?: Partial<EmailConfig>;
}

/* ─── Validation response types ─────────────────────────────────── */
export interface TwilioValidation {
  valid: boolean;
  balance?: string;
  currency?: string;
  message?: string;
}

export interface OpenAiValidation {
  valid: boolean;
  message?: string;
}

export interface SarvamValidation {
  valid: boolean;
  credits?: number;
  message?: string;
}

export interface ValidationResponse<T> {
  success: boolean;
  data: T;
}

/* ─── Credits/Balance info ──────────────────────────────────────── */
export interface CreditsInfo {
  twilio: {
    configured: boolean;
    balance?: string;
    currency?: string;
    phoneNumber?: string;
  };
  openai: {
    configured: boolean;
    valid?: boolean;
  };
  sarvam: {
    configured: boolean;
    valid?: boolean;
  };
  estimatedCostPerMinute: {
    twilio: number;
    openai: number;
    sarvam: number;
    total: number;
  };
}

export interface CreditsResponse {
  success: boolean;
  data: CreditsInfo;
}
