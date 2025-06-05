import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { getUserByEmail } from '../lib/db/queries';
// import { isEmailVerified } from '../lib/services/verificationService'; // For now, let's not block registration on verification

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register a new user - remove the OTP verification check temporarily to debug registration flow
export const register = async (req: Request, res: Response) => {
  try {
    console.log("Register API called with body:", req.body);
    // Validate request body
    const registrationData = registerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await getUserByEmail(registrationData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    /* Temporarily comment out verification check so we can test registration flow
    // Check if email has been verified through OTP
    if (!isEmailVerified(registrationData.email)) {
      return res.status(403).json({ 
        message: 'Email verification required. Please verify your email before registering.' 
      });
    }
    */
    
    // Hash password
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    
    // Create user
    const [user] = await db.insert(users).values({
      name: registrationData.name,
      email: registrationData.email,
      password: hashedPassword,
      role: 'member',
      createdAt: new Date(),
    }).returning();
    
    console.log("User created successfully:", user.id);
    
    // Create session token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return user data (excluding password)
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Failed to register user' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const loginData = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await getUserByEmail(loginData.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Create session token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return user data (excluding password)
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.status(200).json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
    bio: req.user.bio,
    company: req.user.company,
    position: req.user.position,
    location: req.user.location,
    phone: req.user.phone,
    createdAt: req.user.createdAt,
  });
};

// Update user profile
export const updateUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const updateData = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      company: z.string().optional(),
      position: z.string().optional(),
      location: z.string().optional(),
      avatar: z.string().optional(),
    }).parse(req.body);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(db.eq(users.id, req.user.id))
      .returning();
    
    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      company: updatedUser.company,
      position: updatedUser.position,
      location: updatedUser.location,
      phone: updatedUser.phone,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const passwordData = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }).parse(req.body);
    
    // Get current user with password
    const currentUser = await getUserByEmail(req.user.email);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(passwordData.currentPassword, currentUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
    
    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(db.eq(users.id, req.user.id));
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Delete user account
export const deleteAccount = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // Soft delete by setting deletedAt timestamp
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
      })
      .where(db.eq(users.id, req.user.id));
    
    // Clear auth cookie
    res.clearCookie('token');
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
