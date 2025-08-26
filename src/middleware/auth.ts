import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AppError } from './errorHandler';
import { AuthRequest } from '../types';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    const user = await authService.verifyToken(token);
    if (!user) {
      throw new AppError('Invalid or expired token', 401);
    }

    (req as AuthRequest).user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw new AppError('Authentication required', 401);
    }

    const hasRequiredRole = roles.some(role => authReq.user!.roles.includes(role));
    if (!hasRequiredRole) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await authService.verifyToken(token);
      if (user) {
        (req as AuthRequest).user = user;
      }
    }

    next();
  } catch {
    // Optional auth - continue even if token is invalid
    next();
  }
};