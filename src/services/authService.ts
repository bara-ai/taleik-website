import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { database } from '../database';
import { User, JWTPayload } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'id'>;
  token: string;
}

class AuthService {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Validate input
    if (!userData.email || !userData.password) {
      throw new AppError('Email and password are required', 400);
    }

    if (!this.isValidEmail(userData.email)) {
      throw new AppError('Invalid email format', 400);
    }

    if (userData.password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Check if user already exists
    const existingUser = await database.getUserByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await database.createUser({
      email: userData.email,
      phone: userData.phone,
      roles: ['buyer'], // Default role
      mfa_enabled: false,
      status: 'active',
    }, hashedPassword);

    // Generate JWT token
    const token = this.generateJWTToken(user);

    return {
      user: {
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        mfa_enabled: user.mfa_enabled,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Validate input
    if (!loginData.email || !loginData.password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await database.getUserByEmail(loginData.email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const hashedPassword = await database.getUserPassword(user.id);
    if (!hashedPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(loginData.password, hashedPassword);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check user status
    if (user.status !== 'active') {
      throw new AppError('Account is suspended or pending activation', 401);
    }

    // Generate JWT token
    const token = this.generateJWTToken(user);

    return {
      user: {
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        mfa_enabled: user.mfa_enabled,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
    };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, CONFIG.JWT.SECRET) as JWTPayload;
      const user = await database.getUserById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate new password
    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Get user and verify current password
    const user = await database.getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const currentHashedPassword = await database.getUserPassword(userId);
    if (!currentHashedPassword) {
      throw new AppError('Invalid user state', 500);
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, currentHashedPassword);
    if (!isValidCurrentPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password and update
    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    await database.updateUserPassword(userId, newHashedPassword);
  }

  private generateJWTToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };

    return jwt.sign(payload, CONFIG.JWT.SECRET, {
      expiresIn: '7d',
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const authService = new AuthService();
export default authService;