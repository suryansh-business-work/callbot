import { z } from 'zod';

export const createPromptSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(2).max(200),
  description: z.string().max(1000).optional().default(''),
  systemPrompt: z.string({ required_error: 'System prompt is required' }).min(10).max(10000),
  firstMessage: z.string().max(500).optional().default(''),
  language: z.string().optional().default('en-IN'),
  tags: z.array(z.string()).optional().default([]),
});

export const updatePromptSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  systemPrompt: z.string().min(10).max(10000).optional(),
  firstMessage: z.string().max(500).optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const promptListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export const generatePromptSchema = z.object({
  description: z.string({ required_error: 'Description is required' }).min(5).max(2000),
  language: z.string().optional().default('en-IN'),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
export type PromptListQueryInput = z.infer<typeof promptListQuerySchema>;
export type GeneratePromptInput = z.infer<typeof generatePromptSchema>;
