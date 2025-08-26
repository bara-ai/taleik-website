import { ApiResponse } from '../types';

export const successResponse = <T>(
  data: T, 
  message?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const errorResponse = (
  error: string, 
  message?: string
): ApiResponse => ({
  success: false,
  error,
  message,
});

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};