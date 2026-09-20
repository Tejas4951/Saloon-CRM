import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '@/models/User';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    username: string;
    role: string;
  }
}

const scrypt = promisify(_scrypt);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

/**
 * Hashes a password using scrypt
 * @param password The plain text password to hash
 * @returns A promise that resolves to the hashed password (format: salt.hash)
 * @throws {Error} If hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}.${hash.toString('hex')}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies a password against a stored hash
 * @param storedPassword The stored hashed password (format: salt.hash)
 * @param suppliedPassword The password to verify
 * @returns A promise that resolves to true if the password matches, false otherwise
 */
export async function verifyPassword(
  storedPassword: string,
  suppliedPassword: string
): Promise<boolean> {
  try {
    if (!storedPassword || !suppliedPassword) {
      return false;
    }
    
    const [salt, storedHash] = storedPassword.split('.');
    if (!salt || !storedHash) {
      return false;
    }
    
    const hash = (await scrypt(suppliedPassword, salt, 64)) as Buffer;
    return storedHash === hash.toString('hex');
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generates a JWT token for a user
 * @param user The user object containing id, username, and role
 * @returns A JWT token string
 * @throws {Error} If token generation fails
 */
interface TokenPayload extends JwtPayload {
  id: string;
  username: string;
  role: string;
}

export function generateToken(user: { id: string; username: string; role?: string }): string {
  try {
    if (!user || !user.id || !user.username) {
      throw new Error('Invalid user data for token generation');
    }
    
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload: TokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role || 'customer',
      // Add JWT standard claims
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days in seconds
    };

    // Create options object with proper typing
    const options: jwt.SignOptions = {
      issuer: 'salon-management-api',
      subject: user.id,
      audience: 'salon-management-client',
      algorithm: 'HS256',
      // Use type assertion to handle the expiresIn type
      expiresIn: (JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, JWT_SECRET, options);
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token The JWT token to verify
 * @returns A promise that resolves to the decoded token payload
 * @throws {Error} If token verification fails
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  if (!token) {
    throw new Error('No token provided');
  }

  // Handle 'Bearer ' prefix
  const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

  return new Promise((resolve, reject) => {
    if (!JWT_SECRET) {
      return reject(new Error('JWT secret is not configured'));
    }

    jwt.verify(
      tokenValue,
      JWT_SECRET,
      {
        issuer: 'salon-management-api',
        audience: 'salon-management-client',
      },
      (err: jwt.VerifyErrors | null, decoded: unknown) => {
        if (err) {
          let errorMessage = 'Invalid token';
          
          if (err.name === 'TokenExpiredError') {
            errorMessage = 'Token has expired';
          } else if (err.name === 'JsonWebTokenError') {
            errorMessage = 'Malformed token';
          }
          
          console.error('Token verification failed:', err.name, err.message);
          return reject(new Error(errorMessage));
        }
        
        if (!decoded || typeof decoded !== 'object') {
          return reject(new Error('Invalid token payload'));
        }
        
        // Type assertion to TokenPayload
        const payload = decoded as TokenPayload;
        
        // Validate required fields
        if (!payload.id || !payload.username) {
          return reject(new Error('Invalid token payload: missing required fields'));
        }
        
        resolve(payload);
      }
    );
  });
}

// Extract token from request headers
export function getTokenFromHeaders(headers: any): string | null {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}
