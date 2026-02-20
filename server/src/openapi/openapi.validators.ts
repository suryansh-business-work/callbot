import { z } from 'zod';

const phoneRegex = /^\+[1-9]\d{1,14}$/;

/**
 * Unified call initiation schema with user-friendly field names.
 * Maps to internal aiCallSchema fields.
 */
export const unifiedCallSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(phoneRegex, 'Phone number must be in E.164 format (e.g., +911234567890)'),
  firstMessage: z
    .string()
    .min(1, 'First message must not be empty')
    .max(500, 'First message must be under 500 characters')
    .optional()
    .default('Hello! I am your AI assistant. How can I help you today?'),
  voice: z
    .string()
    .min(1)
    .optional()
    .default('meera'),
  model: z
    .string()
    .optional()
    .default('gpt-4o-mini'),
  language: z
    .string()
    .optional()
    .default('en-IN'),
  streaming: z
    .boolean()
    .optional()
    .default(false),
  prompt: z
    .string()
    .max(10000, 'Prompt must be under 10000 characters')
    .optional(),
  agentId: z
    .string()
    .optional(),
});

export type UnifiedCallInput = z.infer<typeof unifiedCallSchema>;
