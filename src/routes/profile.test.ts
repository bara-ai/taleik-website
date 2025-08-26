import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import { database } from '../database';
import { profileService } from '../services/profileService';
import { CONFIG } from '../config';

describe('Profile API', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    await database.clear();
    await profileService.clearAuditLogs();
    
    // Register a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
        phone: '+1234567890',
      });
    
    token = registerRes.body.data.token;
    
    // Get user ID from the database
    const user = await database.getUserByEmail('test@example.com');
    userId = user!.id;
  });

  describe('GET /api/profile', () => {
    it('should get user profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.phone).toBe('+1234567890');
      expect(res.body.message).toBe('Profile retrieved');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile', async () => {
      const updates = {
        phone: '+9876543210',
      };

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+9876543210');
      expect(res.body.message).toBe('Profile updated successfully');

      // Verify audit log was created
      const auditLogs = await profileService.getAuditLogs(userId);
      expect(auditLogs.length).toBeGreaterThan(0);
      const profileUpdateLog = auditLogs.find(log => log.action === 'profile_updated');
      expect(profileUpdateLog).toBeDefined();
      expect(profileUpdateLog!.details.updated).toEqual(updates);
    });

    it('should reject invalid phone number', async () => {
      const updates = {
        phone: 'invalid-phone',
      };

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid phone number format');
    });
  });

  describe('GET /api/profile/audit-logs', () => {
    it('should get user audit logs', async () => {
      // Create some activity first
      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+1111111111' });

      const res = await request(app)
        .get('/api/profile/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toBeDefined();
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      
      // Should have at least registration and profile update logs
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/profile/audit-logs?limit=5&offset=0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(5);
      expect(res.body.data.pagination.offset).toBe(0);
    });
  });

  describe('DELETE /api/profile', () => {
    it('should delete user profile', async () => {
      const res = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile deleted successfully');

      // Verify user is deleted
      const user = await database.getUserById(userId);
      expect(user).toBeNull();

      // Verify audit logs are cleared
      const auditLogs = await profileService.getAuditLogs(userId);
      expect(auditLogs.length).toBe(0);
    });
  });

  describe('Password change with audit logging', () => {
    it('should log password change and session revocation', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'testpassword123',
          newPassword: 'newpassword123',
        });

      expect(res.status).toBe(200);

      // Verify audit logs
      const auditLogs = await profileService.getAuditLogs(userId);
      const passwordChangeLog = auditLogs.find(log => log.action === 'password_changed');
      const sessionRevocationLog = auditLogs.find(log => log.action === 'logout' && log.details.action === 'all_sessions_revoked');
      
      expect(passwordChangeLog).toBeDefined();
      expect(sessionRevocationLog).toBeDefined();
    });
  });

  describe('Admin endpoints', () => {
    let adminToken: string;

    beforeEach(async () => {
      // Create an admin user
      const adminUser = await database.createUser({
        email: 'admin@example.com',
        roles: ['admin'],
        mfa_enabled: false,
        status: 'active',
      }, 'hashedpassword');

      // Generate admin token manually for testing
      adminToken = jwt.sign({
        userId: adminUser.id,
        email: adminUser.email,
        roles: adminUser.roles,
      }, CONFIG.JWT.SECRET, { expiresIn: '7d' });
    });

    it('should allow admin to view user audit logs', async () => {
      const res = await request(app)
        .get(`/api/profile/${userId}/audit-logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(userId);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it('should reject non-admin access to admin endpoints', async () => {
      const res = await request(app)
        .get(`/api/profile/${userId}/audit-logs`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Insufficient permissions');
    });
  });
});