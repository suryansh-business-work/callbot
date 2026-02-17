import twilio from 'twilio';
import { envConfig } from '../config';
import { CallLogItem, CallLogsQuery, CallResponse, VoiceOption } from './calls.models';

let client: ReturnType<typeof twilio> | null = null;

const getTwilioClient = () => {
  if (!client) {
    if (!envConfig.TWILIO_ACCOUNT_SID || !envConfig.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
    }
    if (!envConfig.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      throw new Error('Invalid Twilio Account SID. It must start with "AC". Please check your .env file');
    }
    client = twilio(envConfig.TWILIO_ACCOUNT_SID, envConfig.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Formats message with SSML for more natural, human-like speech
 * Adds pauses, emphasis, and prosody for better delivery
 */
const formatMessageWithSSML = (message: string): string => {
  // Escape XML special characters
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Add natural pauses after punctuation and adjust speech rate for conversational tone
  return `<speak>
    <prosody rate="95%" pitch="+0%">
      ${escaped.replace(/\. /g, '.<break time="500ms"/> ')
               .replace(/! /g, '!<break time="500ms"/> ')
               .replace(/\? /g, '?<break time="500ms"/> ')
               .replace(/: /g, ':<break time="300ms"/> ')
               .replace(/, /g, ',<break time="250ms"/> ')}
    </prosody>
  </speak>`;
};

export const makeCall = async (
  to: string,
  message: string,
  voice: VoiceOption = 'Polly.Joanna-Neural'
): Promise<CallResponse> => {
  try {
    const twilioClient = getTwilioClient();
    
    // Use Amazon Polly Neural voice for most natural, human-like speech
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="en-US">
    ${formatMessageWithSSML(message)}
  </Say>
</Response>`;

    const call = await twilioClient.calls.create({
      to,
      from: envConfig.TWILIO_PHONE_NUMBER,
      twiml,
    });

    return {
      success: true,
      message: 'Call initiated successfully',
      data: {
        callSid: call.sid,
        status: call.status,
        from: call.from,
        to: call.to,
        dateCreated: call.dateCreated?.toISOString() || new Date().toISOString(),
      },
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Failed to make call';
    return {
      success: false,
      message: errMsg,
    };
  }
};

export const getCallLogs = async (
  query: CallLogsQuery
): Promise<{ logs: CallLogItem[]; total: number }> => {
  const { page = 1, pageSize = 10, status, to, from } = query;

  const twilioClient = getTwilioClient();
  
  const filters: Record<string, string> = {};
  if (status) filters.status = status;
  if (to) filters.to = to;
  if (from) filters.from = from;

  const calls = await twilioClient.calls.list({
    ...filters,
    limit: pageSize,
    pageSize,
  });

  const logs: CallLogItem[] = calls.map((call) => ({
    callSid: call.sid,
    from: call.from,
    to: call.to,
    status: call.status,
    direction: call.direction,
    duration: call.duration || '0',
    startTime: call.startTime?.toISOString() || '',
    endTime: call.endTime?.toISOString() || '',
    price: call.price,
    priceUnit: call.priceUnit,
  }));

  return { logs, total: logs.length };
};
