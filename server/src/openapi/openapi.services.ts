import { UnifiedCallInput } from './openapi.validators';
import * as aiService from '../ai/ai.services';
import { initiateStreamingCall } from '../streaming/streaming.services';

/**
 * Initiate a call using either the regular or streaming pipeline.
 * Maps user-friendly field names to internal service parameters.
 */
export const initiateUnifiedCall = async (
  input: UnifiedCallInput,
  userId?: string,
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> => {
  const {
    phone: to,
    firstMessage: message,
    voice,
    model: aiModel,
    language,
    streaming,
    prompt: systemPrompt,
    agentId,
  } = input;

  if (streaming) {
    return initiateStreamingCall(to, message, voice, systemPrompt, agentId, userId, language, aiModel);
  }

  return aiService.initiateAiCall(to, message, voice, systemPrompt, agentId, userId, language, aiModel);
};
