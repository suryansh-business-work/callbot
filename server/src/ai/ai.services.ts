import OpenAI from 'openai';
import twilio from 'twilio';
import { envConfig } from '../config';
import { ConversationState, ConversationMessage } from './ai.models';
import { VoiceOption } from '../calls/calls.models';
import CallLog from '../calllogs/calllogs.models';
import { emitToCall, emitGlobal } from '../websocket';
import { getTunnelUrl } from '../tunnel';
import { generateAndCacheAudio } from '../tts/tts.services';

// ─── In-memory conversation store ───────────────────────────────────────────
const conversations = new Map<string, ConversationState>();

const MAX_SILENCE = 3; // hang up after 3 consecutive silences
const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 min auto-cleanup

// ─── Lazy-loaded clients ────────────────────────────────────────────────────
let openaiClient: OpenAI | null = null;
let twilioClient: ReturnType<typeof twilio> | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    if (!envConfig.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in .env');
    }
    openaiClient = new OpenAI({ apiKey: envConfig.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getTwilioClient = () => {
  if (!twilioClient) {
    if (!envConfig.TWILIO_ACCOUNT_SID || !envConfig.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are not configured');
    }
    twilioClient = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// ─── Webhook URL helper ─────────────────────────────────────────────────────

/** Returns the tunnel URL if available, else falls back to env BASE_URL. */
const getWebhookBaseUrl = (): string => {
  return getTunnelUrl() || envConfig.BASE_URL;
};

// ─── Language name mapping (Sarvam.ai supported languages) ──────────────────
const LANGUAGE_NAMES: Record<string, string> = {
  'en-IN': 'English', 'hi-IN': 'Hindi', 'bn-IN': 'Bengali',
  'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam', 'mr-IN': 'Marathi', 'gu-IN': 'Gujarati',
  'pa-IN': 'Punjabi', 'od-IN': 'Odia',
};

const getLanguageName = (code: string): string => LANGUAGE_NAMES[code] || code;

// ─── Conversation management ────────────────────────────────────────────────

export const createConversation = (
  callSid: string,
  voice: VoiceOption,
  systemPrompt?: string,
  language: string = 'en-IN',
  aiModel?: string
): ConversationState => {
  const basePrompt = systemPrompt || envConfig.AI_SYSTEM_PROMPT;
  const langInstruction = language && !language.startsWith('en')
    ? `\n\nIMPORTANT: You MUST respond ONLY in ${getLanguageName(language)} language. Do not use English unless the user explicitly asks for it.`
    : '';
  const state: ConversationState = {
    callSid,
    voice,
    systemPrompt: basePrompt + langInstruction,
    messages: [
      {
        role: 'system',
        content: basePrompt + langInstruction,
        timestamp: new Date().toISOString(),
      },
    ],
    startedAt: new Date().toISOString(),
    silenceCount: 0,
    language,
    aiModel,
  };
  conversations.set(callSid, state);
  return state;
};

export const getConversation = (callSid: string): ConversationState | undefined =>
  conversations.get(callSid);

export const deleteConversation = (callSid: string): void => {
  conversations.delete(callSid);
};

export const getAllConversations = (): ConversationState[] =>
  Array.from(conversations.values());

// ─── Initiate AI call ───────────────────────────────────────────────────────

export const initiateAiCall = async (
  to: string,
  message: string,
  voice: VoiceOption,
  systemPrompt?: string,
  agentId?: string,
  userId?: string,
  language: string = 'en-IN',
  aiModel?: string
) => {
  let baseUrl = getWebhookBaseUrl();

  // Retry once if tunnel URL appears unavailable
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    await new Promise((r) => setTimeout(r, 2000));
    baseUrl = getWebhookBaseUrl();
  }

  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    throw new Error(
      'AI conversation requires a public URL. The auto-tunnel could not start. ' +
      'Ensure cloudflared is installed (npm install -g cloudflared) or set a public BASE_URL in .env.'
    );
  }

  const client = getTwilioClient();

  // Generate Sarvam.ai TTS audio for the opening message and prompt
  const [messageAudioUrl, listeningAudioUrl, goodbyeAudioUrl] = await Promise.all([
    generateAndCacheAudio(message, language, voice),
    generateAndCacheAudio('I am listening.', language, voice),
    generateAndCacheAudio('I did not hear anything. Goodbye!', language, voice),
  ]);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${messageAudioUrl}</Play>
  <Gather input="speech" action="${baseUrl}/api/ai/conversation/respond" method="POST" speechTimeout="auto" language="${language}" actionOnEmptyResult="true">
    <Play>${listeningAudioUrl}</Play>
  </Gather>
  <Play>${goodbyeAudioUrl}</Play>
</Response>`;

  const call = await client.calls.create({
    to,
    from: envConfig.TWILIO_PHONE_NUMBER,
    twiml,
    record: true,
    recordingChannels: 'dual',
    recordingStatusCallback: `${baseUrl}/api/calls/webhooks/recording-status`,
    recordingStatusCallbackEvent: ['completed'],
    statusCallback: `${baseUrl}/api/ai/conversation/status`,
    statusCallbackEvent: ['completed', 'failed', 'busy', 'no-answer'],
  });

  // Save call log to MongoDB
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

  // Create conversation state
  const convo = createConversation(call.sid, voice, systemPrompt, language, aiModel);

  // Add the opening message as assistant's first message
  convo.messages.push({
    role: 'assistant',
    content: message,
    timestamp: new Date().toISOString(),
  });

  // Emit to UI
  emitToCall(call.sid, 'conversation:update', {
    callSid: call.sid,
    type: 'ai_message',
    content: message,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: 'AI call initiated successfully',
    data: {
      callSid: call.sid,
      status: call.status,
      from: call.from,
      to: call.to,
      dateCreated: call.dateCreated?.toISOString() || new Date().toISOString(),
    },
  };
};

// ─── Handle user speech → OpenAI → TwiML response ──────────────────────────

export const handleUserSpeech = async (
  callSid: string,
  speechResult: string | null
): Promise<string> => {
  const convo = conversations.get(callSid);
  const voice = convo?.voice || 'meera';
  const lang = convo?.language || 'en-IN';
  const baseUrl = getWebhookBaseUrl();

  // If no conversation state, start a basic one
  if (!convo) {
    createConversation(callSid, voice);
    return handleUserSpeech(callSid, speechResult);
  }

  // Handle silence / empty result
  if (!speechResult || speechResult.trim() === '') {
    convo.silenceCount++;

    emitToCall(callSid, 'conversation:update', {
      callSid,
      type: 'silence',
      content: `Silence detected (${convo.silenceCount}/${MAX_SILENCE})`,
      timestamp: new Date().toISOString(),
    });

    if (convo.silenceCount >= MAX_SILENCE) {
      emitToCall(callSid, 'conversation:update', {
        callSid,
        type: 'call_ended',
        content: 'Call ended due to inactivity.',
        timestamp: new Date().toISOString(),
      });
      deleteConversation(callSid);

      const goodbyeUrl = await generateAndCacheAudio(
        'I have not heard anything for a while. Thank you for calling. Goodbye!',
        lang, voice
      );
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${goodbyeUrl}</Play>
  <Hangup/>
</Response>`;
    }

    // Generate both clips in parallel
    const [stillThereUrl, byeUrl] = await Promise.all([
      generateAndCacheAudio('Are you still there? Please go ahead, I am listening.', lang, voice),
      generateAndCacheAudio('Goodbye!', lang, voice),
    ]);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/ai/conversation/respond" method="POST" speechTimeout="auto" language="${lang}" actionOnEmptyResult="true">
    <Play>${stillThereUrl}</Play>
  </Gather>
  <Play>${byeUrl}</Play>
</Response>`;
  }

  // Reset silence counter on valid speech
  convo.silenceCount = 0;

  emitToCall(callSid, 'conversation:update', {
    callSid,
    type: 'user_message',
    content: speechResult,
    timestamp: new Date().toISOString(),
  });

  const userMsg: ConversationMessage = {
    role: 'user',
    content: speechResult,
    timestamp: new Date().toISOString(),
  };
  convo.messages.push(userMsg);

  emitToCall(callSid, 'conversation:update', {
    callSid,
    type: 'ai_thinking',
    content: 'AI is generating a response...',
    timestamp: new Date().toISOString(),
  });

  let aiReply: string;
  try {
    const openai = getOpenAI();
    const chatMessages = convo.messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const completion = await openai.chat.completions.create({
      model: (convo as ConversationState & { aiModel?: string }).aiModel || 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 200,
      temperature: 0.7,
    });

    aiReply = completion.choices[0]?.message?.content?.trim() || 'I apologize, I could not generate a response.';
  } catch (err) {
    console.error('[AI Service] OpenAI error:', err);
    aiReply = 'I apologize, I am having trouble processing your request right now.';
  }

  convo.messages.push({
    role: 'assistant',
    content: aiReply,
    timestamp: new Date().toISOString(),
  });

  emitToCall(callSid, 'conversation:update', {
    callSid,
    type: 'ai_message',
    content: aiReply,
    timestamp: new Date().toISOString(),
  });

  const replyAudioUrl = await generateAndCacheAudio(aiReply, lang, voice);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${replyAudioUrl}</Play>
  <Gather input="speech" action="${baseUrl}/api/ai/conversation/respond" method="POST" speechTimeout="auto" language="${lang}" actionOnEmptyResult="true">
  </Gather>
  <Redirect>${baseUrl}/api/ai/conversation/respond?timeout=true</Redirect>
</Response>`;
};

// ─── Handle call status changes ─────────────────────────────────────────────

export const handleCallStatus = async (callSid: string, status: string): Promise<void> => {
  console.log(`[AI] Call ${callSid} status: ${status}`);

  if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(status)) {
    const convo = conversations.get(callSid);

    emitToCall(callSid, 'conversation:update', {
      callSid,
      type: 'call_ended',
      content: `Call ${status}.`,
      timestamp: new Date().toISOString(),
    });

    // Save conversation messages and update status in DB
    try {
      const updateData: Record<string, unknown> = { status };
      if (convo) {
        updateData.conversationMessages = convo.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp }));
      }
      await CallLog.findOneAndUpdate({ callSid }, updateData);
    } catch (err) {
      console.error(`[AI] Failed to update call log for ${callSid}:`, err);
    }

    // Send full transcript to UI before cleanup
    if (convo) {
      emitToCall(callSid, 'conversation:transcript', {
        callSid,
        messages: convo.messages.filter((m) => m.role !== 'system'),
      });
    }

    // Notify all clients to refresh call logs
    emitGlobal('calllog:updated', { callSid, status });

    deleteConversation(callSid);
  }
};

// ─── Get conversation history for a call ────────────────────────────────────

export const getConversationHistory = (callSid: string) => {
  const convo = conversations.get(callSid);
  if (!convo) return null;
  return {
    callSid: convo.callSid,
    voice: convo.voice,
    startedAt: convo.startedAt,
    messages: convo.messages.filter((m) => m.role !== 'system'),
  };
};

// ─── Periodic cleanup of stale conversations ────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [callSid, convo] of conversations.entries()) {
    if (now - new Date(convo.startedAt).getTime() > CONVERSATION_TTL_MS) {
      console.log(`[AI] Cleaning up stale conversation: ${callSid}`);
      deleteConversation(callSid);
    }
  }
}, 5 * 60 * 1000); // every 5 minutes

// ─── Translation ────────────────────────────────────────────────────────────

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const apiKey = envConfig.SARVAM_API_KEY;

  // Try Sarvam.ai translate first (fast, supports Indian languages)
  if (apiKey) {
    try {
      const sourceLanguage = targetLanguage.startsWith('en') ? 'hi-IN' : 'en-IN';

      const response = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          input: text.slice(0, 5000),
          source_language_code: sourceLanguage,
          target_language_code: targetLanguage,
          model: 'mayura:v1',
          enable_preprocessing: true,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { translated_text: string };
        if (data.translated_text) return data.translated_text;
      } else {
        const errBody = await response.text();
        console.warn('[Sarvam Translate] API error:', response.status, errBody);
      }
    } catch (err) {
      console.warn('[Sarvam Translate] Failed, falling back to OpenAI:', err);
    }
  }

  // Fallback to OpenAI translation
  const openai = getOpenAI();
  const langName = getLanguageName(targetLanguage);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `Translate to ${langName}. Return ONLY the translated text, nothing else.` },
      { role: 'user', content: text },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content?.trim() || text;
};

// ─── AI Prompt Generation ───────────────────────────────────────────────────

export const generateAgentPrompt = async (
  description: string,
  language: string = 'en-IN'
): Promise<{ name: string; systemPrompt: string; description: string }> => {
  const openai = getOpenAI();
  const langName = getLanguageName(language);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert at crafting system prompts for AI phone call agents. Given a user's description, generate:
1. A short name for the agent (2-5 words)
2. A detailed, professional system prompt (200-500 words) that defines the agent's personality, behavior, goals, and conversation style
3. A brief description of the agent (1-2 sentences)

The system prompt should instruct the AI to behave naturally in phone conversations — concise, warm, and professional.

${language !== 'en-IN' ? `IMPORTANT: Write the system prompt in ${langName} language.` : ''}

Respond in VALID JSON format:
{"name": "...", "systemPrompt": "...", "description": "..."}`,
      },
      { role: 'user', content: description },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  try {
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name || 'AI Agent',
      systemPrompt: parsed.systemPrompt || '',
      description: parsed.description || '',
    };
  } catch {
    return { name: 'AI Agent', systemPrompt: raw, description: '' };
  }
};
