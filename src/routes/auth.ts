import { Router, Request, Response } from 'express';
import { authService, RegisterRequest, LoginRequest } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { successResponse } from '../utils/responses';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const userData: RegisterRequest = req.body;
  const result = await authService.register(userData);
  
  res.status(201).json(successResponse(result, 'User registered successfully'));
}));

// Login endpoint
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const loginData: LoginRequest = req.body;
  const result = await authService.login(loginData);
  
  res.json(successResponse(result, 'Login successful'));
}));

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  
  // Return user without sensitive data
  const userProfile = {
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    mfa_enabled: user.mfa_enabled,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
  
  res.json(successResponse(userProfile, 'User profile retrieved'));
}));

// Change password endpoint
router.put('/change-password', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as AuthRequest).user!.id;
  
  await authService.changePassword(userId, currentPassword, newPassword);
  
  res.json(successResponse(null, 'Password changed successfully'));
}));

// Logout endpoint (for completeness - client should just delete token)
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  // In a stateless JWT setup, logout is handled client-side by deleting the token
  // For additional security, you might maintain a blacklist of tokens
  res.json(successResponse(null, 'Logout successful'));
}));

export default router;