import { z } from 'zod';

export const createScheduledCallSchema = z.object({
  contactId: z.string({ required_error: 'Contact is required' }).min(1),
  agentId: z.string().optional().nullable().default(null),
  scheduledAt: z.string({ required_error: 'Scheduled time is required' }).refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),
  source: z.enum(['manual', 'ai_detected', 'agent_cron']).optional().default('manual'),
  reason: z.string().max(500).optional().default(''),
  cronExpression: z.string().max(100).optional().default(''),
  isRecurring: z.boolean().optional().default(false),
  note: z.string().max(1000).optional().default(''),
});

export const updateScheduledCallSchema = z.object({
  scheduledAt: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ).optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'failed', 'manual_required']).optional(),
  reason: z.string().max(500).optional(),
  note: z.string().max(1000).optional(),
  agentId: z.string().optional().nullable(),
  cronExpression: z.string().max(100).optional(),
  isRecurring: z.boolean().optional(),
});

export const scheduledCallListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'completed', 'cancelled', 'failed', 'manual_required']).optional(),
  contactId: z.string().optional(),
  agentId: z.string().optional(),
  source: z.enum(['manual', 'ai_detected', 'agent_cron']).optional(),
  sortBy: z.enum(['scheduledAt', 'createdAt', 'status']).optional().default('scheduledAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateScheduledCallInput = z.infer<typeof createScheduledCallSchema>;
export type UpdateScheduledCallInput = z.infer<typeof updateScheduledCallSchema>;
export type ScheduledCallListQueryInput = z.infer<typeof scheduledCallListQuerySchema>;
