import { Request, Response } from 'express';
import { generateToken } from '@/lib/auth-utils';
import { LoginData } from '@/types/auth';

/**
 * User login endpoint
 * POST /api/auth/login
 * 
 * Request body:
 * - username: string (required)
 * - password: string (required)
 */
export const login = async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    const { username, password }: LoginData = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    // Mock user verification
    const mockUsers = [
      { id: '1', username: 'admin', password: 'password123', role: 'admin', is_active: true },
      { id: '2', username: 'user', password: 'password123', role: 'customer', is_active: true }
    ];

    const user = mockUsers.find(u => 
      u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    // Remove sensitive data from response
    const { password: _, ...userData } = user;

    // Set HTTP-only cookie with the token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token // Still return token for clients that need it (e.g., mobile apps)
    });
  } catch (error) {
    console.error('Login error:', error);
    

    
    res.status(500).json({ 
      success: false,
      message: 'An unexpected error occurred during login' 
    });
  }
}
