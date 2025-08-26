import request from 'supertest';
import app from '../index';
import { database } from '../database';

describe('Auth API', () => {
  beforeEach(async () => {
    await database.clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.roles).toEqual(['buyer']);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.message).toBe('User registered successfully');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email format');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Password must be at least 8 characters long');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User already exists with this email');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(loginData.email);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.message).toBe('Login successful');
    });

    it('should reject login with incorrect email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      // Register and get token
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      token = registerRes.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.roles).toEqual(['buyer']);
      expect(res.body.message).toBe('User profile retrieved');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Access token is required');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let token: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      token = registerRes.body.data.token;
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      };

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');

      // Verify old password no longer works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(loginRes.status).toBe(401);

      // Verify new password works
      const loginRes2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123',
        });

      expect(loginRes2.status).toBe(200);
    });

    it('should reject password change with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Current password is incorrect');
    });
  });
});