import { User } from '../types';
import { generateId } from '../utils/responses';

// Simple in-memory database (replace with real DB later)
class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private userPasswords: Map<string, string> = new Map();

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>, hashedPassword: string): Promise<User> {
    const id = generateId();
    const now = new Date();
    
    const user: User = {
      id,
      ...userData,
      created_at: now,
      updated_at: now,
    };

    this.users.set(id, user);
    this.usersByEmail.set(userData.email, id);
    this.userPasswords.set(id, hashedPassword);
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email);
    return userId ? this.users.get(userId) || null : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updated_at: new Date() };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  async getUserPassword(id: string): Promise<string | null> {
    return this.userPasswords.get(id) || null;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    if (!this.users.has(id)) return false;
    this.userPasswords.set(id, hashedPassword);
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    this.users.delete(id);
    this.usersByEmail.delete(user.email);
    this.userPasswords.delete(id);
    
    return true;
  }

  // For testing purposes
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async clear(): Promise<void> {
    this.users.clear();
    this.usersByEmail.clear();
    this.userPasswords.clear();
  }
}

export const database = new InMemoryDatabase();
export default database;