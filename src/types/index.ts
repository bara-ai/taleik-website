export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  roles: string[];
  mfa_enabled: boolean;
  status: 'active' | 'suspended' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Express.Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}