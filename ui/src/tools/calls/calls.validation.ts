import * as Yup from 'yup';

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const makeCallValidationSchema = Yup.object().shape({
  to: Yup.string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Phone number must be in E.164 format (e.g., +911234567890)'),
  message: Yup.string()
    .max(500, 'Message must be under 500 characters')
    .notRequired(),
  voice: Yup.string().notRequired(),
  language: Yup.string().notRequired(),
  aiEnabled: Yup.boolean().notRequired(),
  streaming: Yup.boolean().notRequired(),
  systemPrompt: Yup.string()
    .max(2000, 'System prompt must be under 2000 characters')
    .notRequired(),
  additionalPrompt: Yup.string()
    .max(2000, 'Additional prompt must be under 2000 characters')
    .notRequired(),
});

export interface MakeCallFormValues {
  to: string;
  message: string;
  voice: string;
  language: string;
  aiEnabled: boolean;
  streaming: boolean;
  systemPrompt: string;
  additionalPrompt: string;
}

export const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful, friendly AI phone assistant. Keep your responses concise and conversational, suitable for a phone call. Respond in 1-3 sentences unless more detail is needed. Be warm, natural, and professional.';

export const makeCallInitialValues: MakeCallFormValues = {
  to: '',
  message: 'Hello! This is a friendly reminder about your upcoming appointment tomorrow at 3 PM. Please call us back if you need to reschedule. Thank you, and have a great day!',
  voice: '',
  language: 'en-IN',
  aiEnabled: false,
  streaming: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  additionalPrompt: '',
};
