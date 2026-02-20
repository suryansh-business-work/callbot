import { z } from 'zod';

export const updateSettingsSchema = z.object({
  useGlobalConfig: z.boolean().optional(),
  callConfig: z
    .object({
      twilioAccountSid: z.string().max(100).optional(),
      twilioAuthToken: z.string().max(100).optional(),
      twilioPhoneNumber: z.string().max(20).optional(),
    })
    .optional(),
  aiConfig: z
    .object({
      openaiApiKey: z.string().max(200).optional(),
    })
    .optional(),
  ttsConfig: z
    .object({
      sarvamApiKey: z.string().max(200).optional(),
    })
    .optional(),
  emailConfig: z
    .object({
      smtpHost: z.string().max(200).optional(),
      smtpPort: z.number().int().min(1).max(65535).optional(),
      smtpUser: z.string().max(200).optional(),
      smtpPass: z.string().max(200).optional(),
      smtpFrom: z.string().max(200).optional(),
    })
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
