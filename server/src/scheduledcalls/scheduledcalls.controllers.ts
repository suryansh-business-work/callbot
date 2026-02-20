import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as service from './scheduledcalls.services';
import {
  createScheduledCallSchema,
  updateScheduledCallSchema,
  scheduledCallListQuerySchema,
} from './scheduledcalls.validators';

export const create = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = createScheduledCallSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    return;
  }
  try {
    const sc = await service.createScheduledCall(userId!, parsed.data);
    res.status(201).json({ success: true, message: 'Scheduled call created', data: sc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create scheduled call';
    res.status(500).json({ success: false, message: msg });
  }
};

export const list = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = scheduledCallListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    return;
  }
  try {
    const result = await service.getScheduledCalls(userId!, parsed.data);
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch scheduled calls';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getById = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const sc = await service.getScheduledCallById(userId!, req.params.id);
    if (!sc) {
      res.status(404).json({ success: false, message: 'Scheduled call not found' });
      return;
    }
    res.json({ success: true, data: sc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch scheduled call';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getByContact = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const data = await service.getScheduledCallsByContact(userId!, req.params.contactId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch scheduled calls';
    res.status(500).json({ success: false, message: msg });
  }
};

export const update = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const parsed = updateScheduledCallSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    return;
  }
  try {
    const sc = await service.updateScheduledCall(userId!, req.params.id, parsed.data);
    if (!sc) {
      res.status(404).json({ success: false, message: 'Scheduled call not found' });
      return;
    }
    res.json({ success: true, message: 'Scheduled call updated', data: sc });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update scheduled call';
    res.status(500).json({ success: false, message: msg });
  }
};

export const remove = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const sc = await service.deleteScheduledCall(userId!, req.params.id);
    if (!sc) {
      res.status(404).json({ success: false, message: 'Scheduled call not found' });
      return;
    }
    res.json({ success: true, message: 'Scheduled call deleted' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete scheduled call';
    res.status(500).json({ success: false, message: msg });
  }
};

export const executeNow = async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    await service.executeScheduledCall(req.params.id, userId!);
    res.json({ success: true, message: 'Scheduled call executed' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to execute scheduled call';
    res.status(500).json({ success: false, message: msg });
  }
};
