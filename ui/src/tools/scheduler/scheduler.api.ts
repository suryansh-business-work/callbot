import apiClient from '../../api/apiClient';
import {
  ScheduledCallsResponse,
  ScheduledCallResponse,
  CreateScheduledCallPayload,
  UpdateScheduledCallPayload,
  ScheduledCallListParams,
  ScheduledCall,
} from './scheduler.types';

export const fetchScheduledCalls = async (
  params?: ScheduledCallListParams
): Promise<ScheduledCallsResponse> => {
  const response = await apiClient.get<ScheduledCallsResponse>('/scheduled-calls', { params });
  return response.data;
};

export const fetchScheduledCallById = async (id: string): Promise<ScheduledCallResponse> => {
  const response = await apiClient.get<ScheduledCallResponse>(`/scheduled-calls/${id}`);
  return response.data;
};

export const fetchScheduledCallsByContact = async (
  contactId: string
): Promise<{ success: boolean; data: ScheduledCall[] }> => {
  const response = await apiClient.get<{ success: boolean; data: ScheduledCall[] }>(
    `/scheduled-calls/contact/${contactId}`
  );
  return response.data;
};

export const createScheduledCall = async (
  payload: CreateScheduledCallPayload
): Promise<ScheduledCallResponse> => {
  const response = await apiClient.post<ScheduledCallResponse>('/scheduled-calls', payload);
  return response.data;
};

export const updateScheduledCall = async (
  id: string,
  payload: UpdateScheduledCallPayload
): Promise<ScheduledCallResponse> => {
  const response = await apiClient.put<ScheduledCallResponse>(`/scheduled-calls/${id}`, payload);
  return response.data;
};

export const deleteScheduledCall = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/scheduled-calls/${id}`
  );
  return response.data;
};

export const executeScheduledCallNow = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `/scheduled-calls/${id}/execute`
  );
  return response.data;
};
