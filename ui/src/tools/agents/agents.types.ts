export interface ScheduleContact {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AgentSchedule {
  cronExpression: string;
  contactIds: (string | ScheduleContact)[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface Agent {
  _id: string;
  userId: string;
  name: string;
  systemPrompt: string;
  voice: string;
  greeting: string;
  image: string | null;
  schedule: AgentSchedule;
  allowScheduling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentsResponse {
  success: boolean;
  data: Agent[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: Agent;
}

export interface SchedulePayload {
  cronExpression?: string;
  contactIds?: string[];
  isActive?: boolean;
}

export interface CreateAgentPayload {
  name: string;
  systemPrompt: string;
  voice?: string;
  greeting?: string;
  schedule?: SchedulePayload;
  allowScheduling?: boolean;
}

export interface UpdateAgentPayload {
  name?: string;
  systemPrompt?: string;
  voice?: string;
  greeting?: string;
  schedule?: SchedulePayload;
  allowScheduling?: boolean;
}
