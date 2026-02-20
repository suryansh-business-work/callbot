import { Request, Response } from 'express';
import { unifiedCallSchema } from './openapi.validators';
import { initiateUnifiedCall } from './openapi.services';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * POST /api/v1/call
 * Unified endpoint to initiate an AI-powered call.
 * Accepts user-friendly field names and routes to regular or streaming pipeline.
 */
export const initiateCall = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = unifiedCallSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await initiateUnifiedCall(parsed.data, req.userId);

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('[OpenAPI] initiateCall error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to initiate call';
    res.status(500).json({ success: false, message: errMsg });
  }
};

/**
 * GET /api/v1/docs
 * Returns the API documentation as JSON (for programmatic consumption).
 */
export const getApiDocs = async (_req: Request, res: Response): Promise<void> => {
  const docs = {
    version: 'v1',
    baseUrl: '/api/v1',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/call',
        description: 'Initiate an AI-powered phone call',
        authentication: 'Bearer <JWT token>',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer <your_jwt_token>',
        },
        body: {
          phone: {
            type: 'string',
            required: true,
            description: 'Phone number in E.164 format (e.g., +911234567890)',
          },
          firstMessage: {
            type: 'string',
            required: false,
            default: 'Hello! I am your AI assistant. How can I help you today?',
            description: 'Opening message the AI speaks when the call connects',
          },
          voice: {
            type: 'string',
            required: false,
            default: 'meera',
            description: 'TTS voice to use (meera, pavithra, maitreyi, arvind, karthik, etc.)',
          },
          model: {
            type: 'string',
            required: false,
            default: 'gpt-4o-mini',
            description: 'AI model to use (gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo)',
          },
          language: {
            type: 'string',
            required: false,
            default: 'en-IN',
            description: 'Language code (en-IN, hi-IN, bn-IN, ta-IN, te-IN, kn-IN, ml-IN, mr-IN, gu-IN, pa-IN, od-IN)',
          },
          streaming: {
            type: 'boolean',
            required: false,
            default: false,
            description: 'Use streaming pipeline for faster response (server-side OpenAI streaming + parallel TTS)',
          },
          prompt: {
            type: 'string',
            required: false,
            description: 'System prompt defining the AI personality and behavior (max 2000 chars)',
          },
          agentId: {
            type: 'string',
            required: false,
            description: 'Agent ID to use pre-configured agent settings',
          },
        },
        responses: {
          200: {
            description: 'Call initiated successfully',
            example: {
              success: true,
              message: 'AI call initiated successfully',
              data: { callSid: 'CA1234567890abcdef', to: '+911234567890' },
            },
          },
          400: {
            description: 'Validation error',
            example: {
              success: false,
              message: 'Validation failed',
              errors: { phone: ['Phone number must be in E.164 format'] },
            },
          },
          401: {
            description: 'Authentication required',
            example: { success: false, message: 'Authentication required' },
          },
          500: {
            description: 'Server error',
            example: { success: false, message: 'Failed to initiate call' },
          },
        },
      },
    ],
  };

  res.status(200).json({ success: true, data: docs });
};
