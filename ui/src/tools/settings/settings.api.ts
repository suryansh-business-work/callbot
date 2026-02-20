import apiClient from '../../api/apiClient';
import {
  SettingsResponse,
  UpdateSettingsPayload,
  ValidationResponse,
  TwilioValidation,
  OpenAiValidation,
  SarvamValidation,
  CreditsResponse,
} from './settings.types';

export const fetchSettings = async (): Promise<SettingsResponse> => {
  const response = await apiClient.get<SettingsResponse>('/settings');
  return response.data;
};

export const updateSettings = async (payload: UpdateSettingsPayload): Promise<SettingsResponse> => {
  const response = await apiClient.put<SettingsResponse>('/settings', payload);
  return response.data;
};

export const validateTwilioApi = async (): Promise<ValidationResponse<TwilioValidation>> => {
  const response = await apiClient.post<ValidationResponse<TwilioValidation>>('/settings/validate/twilio');
  return response.data;
};

export const validateOpenAiApi = async (): Promise<ValidationResponse<OpenAiValidation>> => {
  const response = await apiClient.post<ValidationResponse<OpenAiValidation>>('/settings/validate/openai');
  return response.data;
};

export const validateSarvamApi = async (): Promise<ValidationResponse<SarvamValidation>> => {
  const response = await apiClient.post<ValidationResponse<SarvamValidation>>('/settings/validate/sarvam');
  return response.data;
};

export const fetchCreditsApi = async (): Promise<CreditsResponse> => {
  const response = await apiClient.get<CreditsResponse>('/settings/credits');
  return response.data;
};
