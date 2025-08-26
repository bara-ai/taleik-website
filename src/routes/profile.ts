import { Router, Request, Response } from 'express';
import { profileService, UpdateProfileRequest } from '../services/profileService';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { successResponse } from '../utils/responses';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();

// Get detailed profile (same as /api/auth/me but can be extended)
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user!.id;
  const user = await profileService.getProfile(userId);
  
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
  
  res.json(successResponse(userProfile, 'Profile retrieved'));
}));

// Update profile
router.put('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user!.id;
  const updates: UpdateProfileRequest = req.body;
  
  // Extract audit info from request
  const auditInfo = {
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
  };
  
  const updatedUser = await profileService.updateProfile(userId, updates, auditInfo);
  
  // Return user without sensitive data
  const userProfile = {
    email: updatedUser.email,
    phone: updatedUser.phone,
    roles: updatedUser.roles,
    mfa_enabled: updatedUser.mfa_enabled,
    status: updatedUser.status,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
  };
  
  res.json(successResponse(userProfile, 'Profile updated successfully'));
}));

// Get audit logs for current user
router.get('/audit-logs', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user!.id;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const auditLogs = await profileService.getAuditLogs(userId, limit, offset);
  
  res.json(successResponse({
    logs: auditLogs,
    pagination: {
      limit,
      offset,
      total: auditLogs.length,
    }
  }, 'Audit logs retrieved'));
}));

// Delete profile (GDPR compliance)
router.delete('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user!.id;
  
  await profileService.deleteProfile(userId);
  
  res.json(successResponse(null, 'Profile deleted successfully'));
}));

// Admin endpoints (require admin role)
router.get('/:userId/audit-logs', 
  authenticateToken, 
  requireRoles(['admin', 'support']), 
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const auditLogs = await profileService.getAuditLogs(userId, limit, offset);
    
    res.json(successResponse({
      userId,
      logs: auditLogs,
      pagination: {
        limit,
        offset,
        total: auditLogs.length,
      }
    }, 'User audit logs retrieved'));
  })
);

export default router;