import apiClient from '../../api/apiClient';

export interface SendEmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
}

export const sendEmailApi = async (payload: SendEmailPayload): Promise<SendEmailResponse> => {
  const res = await apiClient.post<SendEmailResponse>('/emails/send', payload);
  return res.data;
};
