import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, envConfig.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Optional auth — extracts userId from JWT if present but never blocks.
 * Useful for public-facing endpoints that optionally track the caller.
 */
export const softAuthMiddleware = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], envConfig.JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch { /* ignore invalid tokens */ }
  }
  next();
};
