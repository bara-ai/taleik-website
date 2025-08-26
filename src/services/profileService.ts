import { database } from '../database';
import { User } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface UpdateProfileRequest {
  phone?: string;
  // Add more profile fields as needed in the future
}

export interface ProfileAuditLog {
  id: string;
  user_id: string;
  action: 'profile_updated' | 'password_changed' | 'login' | 'logout';
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

class ProfileService {
  private auditLogs: Map<string, ProfileAuditLog[]> = new Map();

  async getProfile(userId: string): Promise<User> {
    const user = await database.getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(
    userId: string, 
    updates: UpdateProfileRequest,
    auditInfo?: { ip_address?: string; user_agent?: string }
  ): Promise<User> {
    const user = await database.getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate updates
    if (updates.phone && !this.isValidPhone(updates.phone)) {
      throw new AppError('Invalid phone number format', 400);
    }

    // Update user
    const updatedUser = await database.updateUser(userId, {
      ...updates,
      updated_at: new Date(),
    });

    if (!updatedUser) {
      throw new AppError('Failed to update profile', 500);
    }

    // Log the profile update
    await this.logAuditAction(userId, 'profile_updated', {
      previous: { phone: user.phone },
      updated: updates,
    }, auditInfo);

    return updatedUser;
  }

  async logAuditAction(
    userId: string,
    action: ProfileAuditLog['action'],
    details: Record<string, unknown>,
    auditInfo?: { ip_address?: string; user_agent?: string }
  ): Promise<void> {
    const auditLog: ProfileAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      action,
      details,
      ip_address: auditInfo?.ip_address,
      user_agent: auditInfo?.user_agent,
      created_at: new Date(),
    };

    const userLogs = this.auditLogs.get(userId) || [];
    userLogs.push(auditLog);
    this.auditLogs.set(userId, userLogs);
  }

  async getAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ProfileAuditLog[]> {
    const userLogs = this.auditLogs.get(userId) || [];
    
    // Sort by created_at descending and apply pagination
    return userLogs
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(offset, offset + limit);
  }

  async deleteProfile(userId: string): Promise<void> {
    const user = await database.getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete user data
    const deleted = await database.deleteUser(userId);
    if (!deleted) {
      throw new AppError('Failed to delete profile', 500);
    }

    // Clear audit logs (GDPR compliance)
    this.auditLogs.delete(userId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    // In a real implementation, you would maintain a token blacklist or session store
    // For now, we'll just log the action
    await this.logAuditAction(userId, 'logout', {
      action: 'all_sessions_revoked',
      timestamp: new Date(),
    });
  }

  // For testing/admin purposes - clear all audit logs
  async clearAuditLogs(): Promise<void> {
    this.auditLogs.clear();
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
  }
}

export const profileService = new ProfileService();
export default profileService;