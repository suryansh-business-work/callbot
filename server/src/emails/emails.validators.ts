import { z } from 'zod';

export const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  cc: z.string().optional().default(''),
  bcc: z.string().optional().default(''),
  subject: z.string().min(1, 'Subject is required').max(500),
  html: z.string().min(1, 'Email body is required').max(50000),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
