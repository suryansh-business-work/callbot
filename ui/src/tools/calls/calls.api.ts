import apiClient from '../../api/apiClient';
import { MakeCallPayload, CallResponse, CallLogsResponse, CallLogsParams, AiCallPayload } from './calls.types';

export const makeCall = async (payload: MakeCallPayload): Promise<CallResponse> => {
  const response = await apiClient.post<CallResponse>('/calls', {
    to: payload.to,
    message: payload.message,
    voice: payload.voice,
    agentId: payload.agentId,
    language: payload.language,
  });
  return response.data;
};

export const makeAiCall = async (payload: AiCallPayload): Promise<CallResponse> => {
  const response = await apiClient.post<CallResponse>('/ai/call', {
    to: payload.to,
    message: payload.message,
    voice: payload.voice,
    systemPrompt: payload.systemPrompt,
    agentId: payload.agentId,
    language: payload.language,
    aiModel: payload.aiModel,
  });
  return response.data;
};

export const makeStreamingCall = async (payload: AiCallPayload): Promise<CallResponse> => {
  const response = await apiClient.post<CallResponse>('/ai/stream/call', {
    to: payload.to,
    message: payload.message,
    voice: payload.voice,
    systemPrompt: payload.systemPrompt,
    agentId: payload.agentId,
    language: payload.language,
    aiModel: payload.aiModel,
  });
  return response.data;
};

export const fetchCallLogs = async (params?: CallLogsParams): Promise<CallLogsResponse> => {
  const response = await apiClient.get<CallLogsResponse>('/calls/logs', { params });
  return response.data;
};

export const fetchCallDetail = async (callSid: string) => {
  const response = await apiClient.get(`/calls/${callSid}/detail`);
  return response.data;
};

export const fetchConversationHistory = async (callSid: string) => {
  const response = await apiClient.get(`/ai/conversation/${callSid}`);
  return response.data;
};

export interface TranslatePayload {
  text: string;
  targetLanguage: string;
}

export const translateText = async (payload: TranslatePayload): Promise<{ success: boolean; data: { translated: string } }> => {
  const response = await apiClient.post('/ai/translate', payload);
  return response.data;
};
