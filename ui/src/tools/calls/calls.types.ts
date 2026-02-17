export type VoiceOption = 
  | 'Polly.Joanna-Neural'  // US English female (warm, conversational)
  | 'Polly.Matthew-Neural' // US English male (clear, professional)
  | 'Polly.Amy-Neural'     // British English female (clear, articulate)
  | 'Polly.Brian-Neural'   // British English male (authoritative)
  | 'Polly.Ruth-Neural'    // US English female (young, friendly)
  | 'Polly.Stephen-Neural'; // US English male (mature, confident)

export interface MakeCallPayload {
  to: string;
  message?: string;
  voice?: VoiceOption;
}

export interface CallData {
  callSid: string;
  status: string;
  from: string;
  to: string;
  dateCreated: string;
}

export interface CallResponse {
  success: boolean;
  message: string;
  data?: CallData;
}

export interface CallLogItem {
  callSid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  duration: string;
  startTime: string;
  endTime: string;
  price: string | null;
  priceUnit: string;
}

export interface CallLogsResponse {
  success: boolean;
  message: string;
  data: CallLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface CallLogsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  to?: string;
  from?: string;
}
