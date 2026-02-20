export type ScheduledCallStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'manual_required';
export type ScheduledCallSource = 'manual' | 'ai_detected' | 'agent_cron';

export interface ScheduledCallContact {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface ScheduledCallAgent {
  _id: string;
  name: string;
}

export interface ScheduledCall {
  _id: string;
  userId: string;
  contactId: ScheduledCallContact | string;
  agentId: ScheduledCallAgent | string | null;
  scheduledAt: string;
  status: ScheduledCallStatus;
  source: ScheduledCallSource;
  reason: string;
  callSid: string | null;
  manualOnly: boolean;
  cronExpression: string;
  isRecurring: boolean;
  lastExecutedAt: string | null;
  note: string;
  voice: string;
  language: string;
  systemPrompt: string;
  message: string;
  aiEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledCallPayload {
  contactId: string;
  agentId?: string | null;
  scheduledAt: string;
  source?: ScheduledCallSource;
  reason?: string;
  cronExpression?: string;
  isRecurring?: boolean;
  note?: string;
  voice?: string;
  language?: string;
  systemPrompt?: string;
  message?: string;
  aiEnabled?: boolean;
}

export interface UpdateScheduledCallPayload {
  scheduledAt?: string;
  status?: ScheduledCallStatus;
  reason?: string;
  note?: string;
  agentId?: string | null;
  cronExpression?: string;
  isRecurring?: boolean;
  voice?: string;
  language?: string;
  systemPrompt?: string;
  message?: string;
  aiEnabled?: boolean;
}

export interface ScheduledCallsResponse {
  success: boolean;
  data: ScheduledCall[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface ScheduledCallResponse {
  success: boolean;
  data: ScheduledCall;
  message?: string;
}

export interface ScheduledCallListParams {
  page?: number;
  pageSize?: number;
  status?: ScheduledCallStatus;
  contactId?: string;
  agentId?: string;
  source?: ScheduledCallSource;
  search?: string;
  sortBy?: 'scheduledAt' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}
