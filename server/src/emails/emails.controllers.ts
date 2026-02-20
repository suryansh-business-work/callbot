import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmailSchema } from './emails.validators';
import * as emailService from './emails.services';

export const sendEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    await emailService.sendEmail(req.userId!, parsed.data);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send email';
    console.error('[Email] Send error:', msg);
    res.status(500).json({ success: false, message: msg });
  }
};

export const validateSmtp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await emailService.validateSmtp(req.userId!);
    res.status(200).json({ success: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'SMTP validation failed';
    res.status(500).json({ success: false, message: msg });
  }
};
