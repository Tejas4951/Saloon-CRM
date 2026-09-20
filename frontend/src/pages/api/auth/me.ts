import { Request, Response } from 'express';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth-utils';
import { User } from '@/models/User';

export const me = async (req: Request, res: Response) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from headers
    const token = getTokenFromHeaders(req.headers);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = await verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}
