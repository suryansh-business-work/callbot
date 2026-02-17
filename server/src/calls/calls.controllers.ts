import { Request, Response } from 'express';
import { makeCallSchema, callLogsQuerySchema } from './calls.validators';
import * as callService from './calls.services';

export const initiateCall = async (req: Request, res: Response): Promise<void> => {
  const parsed = makeCallSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { to, message, voice } = parsed.data;
  const result = await callService.makeCall(to, message, voice);

  if (!result.success) {
    res.status(500).json(result);
    return;
  }

  res.status(200).json(result);
};

export const fetchCallLogs = async (req: Request, res: Response): Promise<void> => {
  const parsed = callLogsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { logs, total } = await callService.getCallLogs(parsed.data);

    res.status(200).json({
      success: true,
      message: 'Call logs fetched successfully',
      data: logs,
      pagination: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch call logs';
    res.status(500).json({
      success: false,
      message: errMsg,
    });
  }
};
