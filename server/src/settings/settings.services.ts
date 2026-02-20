import Settings, { ISettings } from './settings.models';
import { UpdateSettingsInput } from './settings.validators';
import { envConfig } from '../config';
import twilio from 'twilio';
import OpenAI from 'openai';

/**
 * Get settings for a user. If none exist, create default settings.
 */
export const getSettings = async (userId: string): Promise<ISettings> => {
  let settings = await Settings.findOne({ userId });
  if (!settings) {
    settings = await Settings.create({ userId });
  }
  return settings;
};

/**
 * Update settings for a user.
 */
export const updateSettings = async (
  userId: string,
  data: UpdateSettingsInput
): Promise<ISettings> => {
  const update: Record<string, unknown> = {};

  if (data.useGlobalConfig !== undefined) {
    update.useGlobalConfig = data.useGlobalConfig;
  }
  if (data.callConfig) {
    if (data.callConfig.twilioAccountSid !== undefined)
      update['callConfig.twilioAccountSid'] = data.callConfig.twilioAccountSid;
    if (data.callConfig.twilioAuthToken !== undefined)
      update['callConfig.twilioAuthToken'] = data.callConfig.twilioAuthToken;
    if (data.callConfig.twilioPhoneNumber !== undefined)
      update['callConfig.twilioPhoneNumber'] = data.callConfig.twilioPhoneNumber;
  }
  if (data.aiConfig) {
    if (data.aiConfig.openaiApiKey !== undefined)
      update['aiConfig.openaiApiKey'] = data.aiConfig.openaiApiKey;
  }
  if (data.ttsConfig) {
    if (data.ttsConfig.sarvamApiKey !== undefined)
      update['ttsConfig.sarvamApiKey'] = data.ttsConfig.sarvamApiKey;
  }
  if (data.emailConfig) {
    if (data.emailConfig.smtpHost !== undefined)
      update['emailConfig.smtpHost'] = data.emailConfig.smtpHost;
    if (data.emailConfig.smtpPort !== undefined)
      update['emailConfig.smtpPort'] = data.emailConfig.smtpPort;
    if (data.emailConfig.smtpUser !== undefined)
      update['emailConfig.smtpUser'] = data.emailConfig.smtpUser;
    if (data.emailConfig.smtpPass !== undefined)
      update['emailConfig.smtpPass'] = data.emailConfig.smtpPass;
    if (data.emailConfig.smtpFrom !== undefined)
      update['emailConfig.smtpFrom'] = data.emailConfig.smtpFrom;
  }

  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true }
  );

  return settings!;
};

/**
 * Get the resolved config for a user.
 * If useGlobalConfig is false, return .env values.
 * If useGlobalConfig is true, return the user's custom values.
 */
export const getResolvedConfig = async (
  userId: string
): Promise<{
  callConfig: { twilioAccountSid: string; twilioAuthToken: string; twilioPhoneNumber: string };
  aiConfig: { openaiApiKey: string };
  ttsConfig: { sarvamApiKey: string };
}> => {
  const settings = await getSettings(userId);

  if (!settings.useGlobalConfig) {
    return {
      callConfig: {
        twilioAccountSid: envConfig.TWILIO_ACCOUNT_SID,
        twilioAuthToken: envConfig.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: envConfig.TWILIO_PHONE_NUMBER,
      },
      aiConfig: {
        openaiApiKey: envConfig.OPENAI_API_KEY,
      },
      ttsConfig: {
        sarvamApiKey: envConfig.SARVAM_API_KEY,
      },
    };
  }

  return {
    callConfig: {
      twilioAccountSid: settings.callConfig.twilioAccountSid || envConfig.TWILIO_ACCOUNT_SID,
      twilioAuthToken: settings.callConfig.twilioAuthToken || envConfig.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: settings.callConfig.twilioPhoneNumber || envConfig.TWILIO_PHONE_NUMBER,
    },
    aiConfig: {
      openaiApiKey: settings.aiConfig.openaiApiKey || envConfig.OPENAI_API_KEY,
    },
    ttsConfig: {
      sarvamApiKey: settings.ttsConfig.sarvamApiKey || envConfig.SARVAM_API_KEY,
    },
  };
};

/* ─── Validate Twilio ──────────────────────────────────────────── */
export const validateTwilio = async (
  userId: string
): Promise<{ valid: boolean; balance?: string; currency?: string; message?: string }> => {
  const config = await getResolvedConfig(userId);
  const { twilioAccountSid, twilioAuthToken } = config.callConfig;

  if (!twilioAccountSid || !twilioAuthToken) {
    return { valid: false, message: 'Twilio credentials are not configured' };
  }

  try {
    const client = twilio(twilioAccountSid, twilioAuthToken);
    const bal = await client.balance.fetch();
    return {
      valid: true,
      balance: bal.balance,
      currency: bal.currency,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid Twilio credentials';
    return { valid: false, message: msg };
  }
};

/* ─── Validate OpenAI ──────────────────────────────────────────── */
export const validateOpenAi = async (
  userId: string
): Promise<{ valid: boolean; message?: string }> => {
  const config = await getResolvedConfig(userId);
  const { openaiApiKey } = config.aiConfig;

  if (!openaiApiKey) {
    return { valid: false, message: 'OpenAI API key is not configured' };
  }

  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });
    // Validate by making a minimal chat completion call
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    });
    if (res.choices && res.choices.length > 0) {
      return { valid: true, message: 'API key is valid' };
    }
    return { valid: false, message: 'Unexpected response from OpenAI' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid OpenAI API key';
    return { valid: false, message: msg };
  }
};

/* ─── Validate Sarvam ──────────────────────────────────────────── */
export const validateSarvam = async (
  userId: string
): Promise<{ valid: boolean; credits?: number; message?: string }> => {
  const config = await getResolvedConfig(userId);
  const { sarvamApiKey } = config.ttsConfig;

  if (!sarvamApiKey) {
    return { valid: false, message: 'Sarvam API key is not configured' };
  }

  try {
    // Sarvam doesn't have a dedicated credits endpoint; validate by making a small request
    const resp = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamApiKey,
      },
      body: JSON.stringify({
        inputs: ['test'],
        target_language_code: 'en-IN',
        speaker: 'anushka',
        model: 'bulbul:v2',
      }),
    });

    if (resp.ok) {
      return { valid: true, message: 'API key is valid' };
    }

    const errBody = await resp.text();
    return { valid: false, message: errBody || `HTTP ${resp.status}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to validate Sarvam API key';
    return { valid: false, message: msg };
  }
};

/* ─── Get All Credits/Balances ─────────────────────────────────── */
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
  /** Estimated costs per AI call minute (USD) */
  estimatedCostPerMinute: {
    twilio: number;
    openai: number;
    sarvam: number;
    total: number;
  };
}

export const getCreditsInfo = async (userId: string): Promise<CreditsInfo> => {
  const config = await getResolvedConfig(userId);

  const result: CreditsInfo = {
    twilio: { configured: false },
    openai: { configured: false },
    sarvam: { configured: false },
    estimatedCostPerMinute: {
      twilio: 0.014, // ~$0.014/min outbound US
      openai: 0.006, // ~$0.006/min for GPT-4o-mini (input+output tokens)
      sarvam: 0.002, // ~$0.002/min TTS
      total: 0.022,
    },
  };

  // Check Twilio
  if (config.callConfig.twilioAccountSid && config.callConfig.twilioAuthToken) {
    result.twilio.configured = true;
    result.twilio.phoneNumber = config.callConfig.twilioPhoneNumber;
    try {
      const client = twilio(config.callConfig.twilioAccountSid, config.callConfig.twilioAuthToken);
      const bal = await client.balance.fetch();
      result.twilio.balance = bal.balance;
      result.twilio.currency = bal.currency;
    } catch { /* ignore - will show as configured but no balance */ }
  }

  // Check OpenAI
  if (config.aiConfig.openaiApiKey) {
    result.openai.configured = true;
    try {
      const openai = new OpenAI({ apiKey: config.aiConfig.openaiApiKey });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      });
      result.openai.valid = !!(res.choices && res.choices.length > 0);
    } catch {
      result.openai.valid = false;
    }
  }

  // Check Sarvam
  if (config.ttsConfig.sarvamApiKey) {
    result.sarvam.configured = true;
    result.sarvam.valid = true; // Assume valid if key exists
  }

  return result;
};
