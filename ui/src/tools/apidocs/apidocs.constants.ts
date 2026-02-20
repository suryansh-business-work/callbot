export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface ApiResponse {
  status: number;
  description: string;
  example: Record<string, unknown>;
}

export const CALL_API_PARAMS: ApiParam[] = [
  {
    name: 'phone',
    type: 'string',
    required: true,
    description: 'Phone number in E.164 format (e.g., +911234567890)',
  },
  {
    name: 'firstMessage',
    type: 'string',
    required: false,
    default: 'Hello! I am your AI assistant. How can I help you today?',
    description: 'Opening message the AI speaks when the call connects',
  },
  {
    name: 'voice',
    type: 'string',
    required: false,
    default: 'meera',
    description: 'TTS voice — meera, pavithra, maitreyi, arvind, karthik, etc.',
  },
  {
    name: 'model',
    type: 'string',
    required: false,
    default: 'gpt-4o-mini',
    description: 'AI model — gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo',
  },
  {
    name: 'language',
    type: 'string',
    required: false,
    default: 'en-IN',
    description: 'Language code — en-IN, hi-IN, bn-IN, ta-IN, te-IN, kn-IN, ml-IN, mr-IN, gu-IN, pa-IN, od-IN',
  },
  {
    name: 'streaming',
    type: 'boolean',
    required: false,
    default: 'false',
    description: 'Use streaming pipeline for faster response (server-side OpenAI streaming + parallel TTS)',
  },
  {
    name: 'prompt',
    type: 'string',
    required: false,
    description: 'System prompt defining the AI personality and behavior (max 2000 chars)',
  },
  {
    name: 'agentId',
    type: 'string',
    required: false,
    description: 'Agent ID to use pre-configured agent settings',
  },
];

export const CALL_API_RESPONSES: ApiResponse[] = [
  {
    status: 200,
    description: 'Call initiated successfully',
    example: {
      success: true,
      message: 'AI call initiated successfully',
      data: { callSid: 'CA1234567890abcdef', to: '+911234567890' },
    },
  },
  {
    status: 400,
    description: 'Validation error',
    example: {
      success: false,
      message: 'Validation failed',
      errors: { phone: ['Phone number must be in E.164 format'] },
    },
  },
  {
    status: 401,
    description: 'Authentication required',
    example: { success: false, message: 'Authentication required' },
  },
  {
    status: 500,
    description: 'Server error',
    example: { success: false, message: 'Failed to initiate call' },
  },
];

export const CURL_EXAMPLE = `curl -X POST {BASE_URL}/api/v1/call \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -d '{
    "phone": "+911234567890",
    "firstMessage": "Hello! How can I help you?",
    "voice": "meera",
    "model": "gpt-4o-mini",
    "language": "en-IN",
    "streaming": false,
    "prompt": "You are a helpful customer support agent."
  }'`;

export const JS_EXAMPLE = `const response = await fetch('{BASE_URL}/api/v1/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your_jwt_token>',
  },
  body: JSON.stringify({
    phone: '+911234567890',
    firstMessage: 'Hello! How can I help you?',
    voice: 'meera',
    model: 'gpt-4o-mini',
    language: 'en-IN',
    streaming: false,
    prompt: 'You are a helpful customer support agent.',
  }),
});

const data = await response.json();
console.log(data);`;

export const PYTHON_EXAMPLE = `import requests

response = requests.post(
    '{BASE_URL}/api/v1/call',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <your_jwt_token>',
    },
    json={
        'phone': '+911234567890',
        'firstMessage': 'Hello! How can I help you?',
        'voice': 'meera',
        'model': 'gpt-4o-mini',
        'language': 'en-IN',
        'streaming': False,
        'prompt': 'You are a helpful customer support agent.',
    },
)

print(response.json())`;
