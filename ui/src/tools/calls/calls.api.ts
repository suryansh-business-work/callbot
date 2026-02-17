import apiClient from '../../api/apiClient';
import { MakeCallPayload, CallResponse, CallLogsResponse, CallLogsParams } from './calls.types';

export const makeCall = async (payload: MakeCallPayload): Promise<CallResponse> => {
  const response = await apiClient.post<CallResponse>('/calls', {
    to: payload.to,
    message: payload.message,
    voice: payload.voice,
  });
  return response.data;
};

export const fetchCallLogs = async (params?: CallLogsParams): Promise<CallLogsResponse> => {
  const response = await apiClient.get<CallLogsResponse>('/calls/logs', { params });
  return response.data;
};
