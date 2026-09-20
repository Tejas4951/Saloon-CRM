import { hashPassword } from '@/lib/auth-utils';

export interface UserData {
  id: string;
  username: string;
  email: string | null;
  password: string;
  phone_number: string;
  profile_picture: string | null;
  role: 'admin' | 'staff' | 'customer';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class User {
  /**
   * Create a new user
   */
  static async create(userData: {
    username: string;
    email?: string | null;
    password: string;
    phone_number: string;
    profile_picture?: string | null;
    role?: 'admin' | 'staff' | 'customer';
  }): Promise<UserData> {
    try {
      // Check if username already exists
      const existingUser = await this.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Check if email already exists (if provided)
      if (userData.email) {
        const emailExists = await this.findByEmail(userData.email);
        if (emailExists) {
          throw new Error('Email already in use');
        }
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create mock user data
      const newUser = {
        id: Math.random().toString(36).substring(2),
        username: userData.username,
        email: userData.email || null,
        password: hashedPassword,
        phone_number: userData.phone_number,
        profile_picture: userData.profile_picture || null,
        role: userData.role || 'customer',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      } as UserData;

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find a user by username
   */
  static async findByUsername(username: string): Promise<UserData | null> {
    try {
      // Mock user data
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          password: await hashPassword('password123'),
          phone_number: '1234567890',
          profile_picture: null,
          role: 'admin' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          password: await hashPassword('password123'),
          phone_number: '0987654321',
          profile_picture: null,
          role: 'customer' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      return mockUsers.find(u => u.username === username) || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find a user by email
   */
  static async findByEmail(email: string): Promise<UserData | null> {
    try {
      // Mock user data
      const mockUsers: UserData[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          password: await hashPassword('password123'),
          phone_number: '1234567890',
          profile_picture: null,
          role: 'admin' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          password: await hashPassword('password123'),
          phone_number: '0987654321',
          profile_picture: null,
          role: 'customer' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      return mockUsers.find(u => u.email === email) || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<UserData | null> {
    try {
      // Mock user data
      const mockUsers: UserData[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          password: await hashPassword('password123'),
          phone_number: '1234567890',
          profile_picture: null,
          role: 'admin' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          password: await hashPassword('password123'),
          phone_number: '0987654321',
          profile_picture: null,
          role: 'customer' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      return mockUsers.find(u => u.id === id) || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  static async update(
    id: string, 
    updates: Partial<Omit<UserData, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<UserData | null> {
    try {
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      // Mock user data
      const mockUsers: UserData[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          password: await hashPassword('password123'),
          phone_number: '1234567890',
          profile_picture: null,
          role: 'admin' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          password: await hashPassword('password123'),
          phone_number: '0987654321',
          profile_picture: null,
          role: 'customer' as 'admin' | 'staff' | 'customer',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      // Find the user
      const user = mockUsers.find(u => u.id === id);
      if (!user) {
        return null;
      }

      // Update the user with new data
      const updatedUser = {
        id: user.id,
        username: updates.username || user.username,
        email: updates.email || user.email,
        password: updates.password || user.password,
        phone_number: updates.phone_number || user.phone_number,
        profile_picture: updates.profile_picture || user.profile_picture,
        role: updates.role as 'admin' | 'staff' | 'customer' || user.role,
        is_active: updates.is_active || user.is_active,
        created_at: user.created_at,
        updated_at: new Date()
      } as UserData;

      // Find index and update
      const index = mockUsers.findIndex(u => u.id === id);
      mockUsers[index] = updatedUser;
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user by ID
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // Mock user data
      const mockUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          password: await hashPassword('password123'),
          phone_number: '1234567890',
          profile_picture: null,
          role: 'admin' as const,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          username: 'user',
          email: 'user@example.com',
          password: await hashPassword('password123'),
          phone_number: '0987654321',
          profile_picture: null,
          role: 'customer' as const,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      // Find and remove the user
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) {
        return false;
      }

      mockUsers.splice(index, 1);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Verify user credentials
   */
  static async verifyCredentials(
    username: string,
    password: string
  ): Promise<UserData | null> {
    try {
      const user = await this.findByUsername(username);
      if (!user) {
        return null;
      }
      
      const isPasswordValid = await this.verifyPassword(user.password, password);
      return isPasswordValid ? user : null;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to verify a password against a hash
   */
  private static async verifyPassword(
    storedHash: string,
    suppliedPassword: string
  ): Promise<boolean> {
    const { verifyPassword } = await import('@/lib/auth-utils');
    return verifyPassword(storedHash, suppliedPassword);
  }
}
