import * as Yup from 'yup';

export const promptValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').min(2, 'Min 2 chars').max(200, 'Max 200 chars'),
  description: Yup.string().max(1000, 'Max 1000 chars'),
  systemPrompt: Yup.string().required('System prompt is required').min(10, 'Min 10 chars').max(10000, 'Max 10000 chars'),
  firstMessage: Yup.string().max(500, 'Max 500 chars'),
  language: Yup.string(),
  tags: Yup.array().of(Yup.string()),
});

export interface PromptFormValues {
  name: string;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  language: string;
  tags: string[];
}

export const promptInitialValues: PromptFormValues = {
  name: '',
  description: '',
  systemPrompt: '',
  firstMessage: '',
  language: 'en-IN',
  tags: [],
};
