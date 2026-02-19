export interface PromptTemplate {
  _id: string;
  userId: string;
  name: string;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptsResponse {
  success: boolean;
  data: PromptTemplate[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface PromptResponse {
  success: boolean;
  message: string;
  data?: PromptTemplate;
}

export interface CreatePromptPayload {
  name: string;
  description?: string;
  systemPrompt: string;
  firstMessage?: string;
  language?: string;
  tags?: string[];
}

export interface UpdatePromptPayload {
  name?: string;
  description?: string;
  systemPrompt?: string;
  firstMessage?: string;
  language?: string;
  tags?: string[];
}

export interface GeneratePromptResponse {
  success: boolean;
  data: {
    name: string;
    systemPrompt: string;
    description: string;
  };
}
