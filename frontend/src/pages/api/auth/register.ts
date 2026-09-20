import { User, UserData } from '@/models/User';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface ApiRequest extends Request {
  body: any;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: any): Promise<void>;
  setHeader(name: string, value: string): ApiResponse;
}

// Generate JWT token
const generateToken = (user: UserData) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  return `Bearer ${JSON.stringify(payload)}`;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // Set desired size limit
    },
  },
};

/*
 * POST /api/auth/register
 * 
 * Request body:
 * - username: string (required)
 * - email: string (required, must be unique)
 * - phone_number: string (required)
 * - password: string (required, min 8 chars)
 */

export default async function handler(
  req: ApiRequest,
  res: ApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const { username, email, phone_number, password } = req.body as {
      username: string;
      email: string;
      phone_number: string;
      password: string;
    };

    // Validate input
    if (!username || !email || !password || !phone_number) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: UserData = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      phone_number,
      profile_picture: null,
      role: 'customer' as const,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Generate JWT token
    const token = await generateToken(newUser);

    // Set HTTP-only cookie with the token
    res.setHeader('Set-Cookie', [
      `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
      ...(process.env.NODE_ENV === 'production' ? ['Secure'] : [])
    ].join('; '));

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone_number: newUser.phone_number,
        profile_picture: newUser.profile_picture,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Registration failed'
    });
  }
}
