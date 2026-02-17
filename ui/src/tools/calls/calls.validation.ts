import * as Yup from 'yup';

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const makeCallValidationSchema = Yup.object().shape({
  to: Yup.string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Phone number must be in E.164 format (e.g., +911234567890)'),
  message: Yup.string()
    .max(500, 'Message must be under 500 characters')
    .notRequired(),
  voice: Yup.string()
    .oneOf([
      'Polly.Joanna-Neural',
      'Polly.Matthew-Neural',
      'Polly.Amy-Neural',
      'Polly.Brian-Neural',
      'Polly.Ruth-Neural',
      'Polly.Stephen-Neural',
    ])
    .notRequired(),
});

export interface MakeCallFormValues {
  to: string;
  message: string;
  voice: string;
}

export const makeCallInitialValues: MakeCallFormValues = {
  to: '',
  message: 'Hello! This is a friendly reminder about your upcoming appointment tomorrow at 3 PM. Please call us back if you need to reschedule. Thank you, and have a great day!',
  voice: 'Polly.Joanna-Neural',
};

export const voiceOptions = [
  { value: 'Polly.Joanna-Neural', label: 'Joanna (US Female - Warm & Conversational)' },
  { value: 'Polly.Matthew-Neural', label: 'Matthew (US Male - Professional & Clear)' },
  { value: 'Polly.Amy-Neural', label: 'Amy (UK Female - Clear & Articulate)' },
  { value: 'Polly.Brian-Neural', label: 'Brian (UK Male - Authoritative)' },
  { value: 'Polly.Ruth-Neural', label: 'Ruth (US Female - Young & Friendly)' },
  { value: 'Polly.Stephen-Neural', label: 'Stephen (US Male - Mature & Confident)' },
];
