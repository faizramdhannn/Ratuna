import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Verify password
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Create JWT token
export const createToken = (user) => {
  return jwt.sign(
    { 
      userId: user.user_id, 
      username: user.username, 
      role: user.role,
      fullName: user.full_name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Get current user from cookies
export const getCurrentUser = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) return null;
    
    const decoded = verifyToken(token.value);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Check if user has permission
export const hasPermission = (userRole, requiredRoles) => {
  if (!Array.isArray(requiredRoles)) {
    requiredRoles = [requiredRoles];
  }
  return requiredRoles.includes(userRole);
};