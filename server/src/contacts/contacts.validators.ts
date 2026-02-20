import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }).min(1).max(100),
  lastName: z.string().max(100).optional().default(''),
  email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
  phone: z.string().max(20).optional().default(''),
  jobTitle: z.string().max(100).optional().default(''),
  companyId: z.string().optional().nullable().default(null),
  notes: z.string().max(2000).optional().default(''),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

export const updateContactSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().max(20).optional(),
  jobTitle: z.string().max(100).optional(),
  companyId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const contactListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(500).optional().default(20),
  search: z.string().optional(),
  companyId: z.string().optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'lastCalledAt', 'totalCalls']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactListQueryInput = z.infer<typeof contactListQuerySchema>;
