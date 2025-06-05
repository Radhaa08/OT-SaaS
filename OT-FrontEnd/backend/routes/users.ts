import express from "express";
import { Request, Response } from "express";
import { compare } from 'bcryptjs';
import { db } from '../lib/db/drizzle';
import { users, ActivityType, jobActivityLogs } from '../lib/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { setSession, hashPassword, clearSession } from '../lib/auth/session';
import { getUserByEmail, getUserById } from '../lib/db/queries';
import { isAuthenticated, hasRole } from '../lib/auth/middleware';

const router = express.Router();

// Helper function to log user activity
async function logUserActivity(
  req: Request,
  userId: number,
  action: ActivityType,
  details?: string
) {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    
    await db.insert(jobActivityLogs).values({
      consultantId: userId,
      entityType: 'user',
      entityId: userId.toString(),
      action,
      details: details || '',
      ipAddress,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// PUBLIC ROUTES

// Register a new user (all users are consultants by default with 'member' role)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      email, 
      password,
      phone, 
      bio, 
      company, 
      position, 
      location 
    } = req.body;
    
    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    // All users are members (consultants) by default
    const role = 'member';
    
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role,
        isPaid: false, // Default to unpaid
        phone,
        bio,
        company,
        position,
        location,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Set session cookie
    await setSession(res, user);
    
    // Log activity
    await logUserActivity(
      req,
      user.id,
      ActivityType.SIGN_UP,
      'New user account created'
    );
    
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPaid: user.isPaid,
      expiryDate: user.expiryDate,
      phone: user.phone,
      bio: user.bio,
      company: user.company,
      position: user.position,
      location: user.location
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare password
    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session cookie
    await setSession(res, user);
    
    // Log activity
    await logUserActivity(
      req,
      user.id,
      ActivityType.SIGN_IN,
      'User logged in'
    );
    
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPaid: user.isPaid,
      expiryDate: user.expiryDate
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
router.post('/logout', (req: Request, res: Response) => {
  // Log activity if user is authenticated
  if (req.user) {
    logUserActivity(
      req,
      req.user.id,
      ActivityType.SIGN_OUT,
      'User logged out'
    ).catch(err => console.error('Error logging logout activity:', err));
  }
  
  clearSession(res);
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Get all consultants (publicly accessible) - all members are consultants
router.get('/consultants', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const consultants = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isPaid: users.isPaid,
      expiryDate: users.expiryDate,
      phone: users.phone,
      avatar: users.avatar,
      bio: users.bio,
      company: users.company,
      position: users.position,
      location: users.location,
      createdAt: users.createdAt
    })
    .from(users)
    .where(and(
      eq(users.role, 'member'),  // All members are consultants
      isNull(users.deletedAt)
    ))
    .limit(limit)
    .offset(offset);
    
    return res.status(200).json(consultants);
  } catch (error) {
    console.error('Get consultants error:', error);
    return res.status(500).json({ error: 'Failed to fetch consultants' });
  }
});

// Get consultant by ID (publicly accessible)
router.get('/consultants/:id', async (req: Request, res: Response) => {
  try {
    const consultantId = parseInt(req.params.id);
    if (isNaN(consultantId)) {
      return res.status(400).json({ error: 'Invalid consultant ID' });
    }
    
    const consultant = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isPaid: users.isPaid,
      expiryDate: users.expiryDate,
      phone: users.phone,
      avatar: users.avatar,
      bio: users.bio,
      company: users.company,
      position: users.position,
      location: users.location,
      createdAt: users.createdAt
    })
    .from(users)
    .where(and(
      eq(users.id, consultantId),
      eq(users.role, 'member'),  // All members are consultants
      isNull(users.deletedAt)
    ));
    
    if (!consultant || consultant.length === 0) {
      return res.status(404).json({ error: 'Consultant not found' });
    }
    
    return res.status(200).json(consultant[0]);
  } catch (error) {
    console.error('Get consultant error:', error);
    return res.status(500).json({ error: 'Failed to fetch consultant' });
  }
});

// PROTECTED ROUTES - require authentication
router.use(isAuthenticated);

// Get current user profile
router.get('/me', (req: Request, res: Response) => {
  try {
    // User is already attached to req by the isAuthenticated middleware
    const user = req.user!;
    
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPaid: user.isPaid,
      expiryDate: user.expiryDate,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      company: user.company,
      position: user.position,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/me', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { 
      name, 
      phone, 
      avatar, 
      bio, 
      company, 
      position, 
      location 
    } = req.body;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        name,
        phone,
        avatar,
        bio,
        company,
        position,
        location,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning();
    
    // Log activity - all users are consultants
    await logUserActivity(
      req,
      user.id,
      ActivityType.UPDATE_ACCOUNT,
      'Profile updated'
    );
    
    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isPaid: updatedUser.isPaid,
      expiryDate: updatedUser.expiryDate,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      company: updatedUser.company,
      position: updatedUser.position,
      location: updatedUser.location
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash and update new password
    const passwordHash = await hashPassword(newPassword);
    
    await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    
    // Log activity
    await logUserActivity(
      req,
      user.id,
      ActivityType.UPDATE_PASSWORD,
      'Password changed'
    );
    
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete account (soft delete)
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    await db
      .update(users)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    
    // Log activity
    await logUserActivity(
      req,
      user.id,
      ActivityType.DELETE_ACCOUNT,
      'Account deleted'
    );
    
    // Clear session
    clearSession(res);
    
    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ADMIN ROUTES
// Update user payment status (admin only)
router.patch('/payment-status/:id', hasRole('admin'), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const { isPaid, expiryDate } = req.body;
    if (typeof isPaid !== 'boolean') {
      return res.status(400).json({ error: 'isPaid must be a boolean value' });
    }
    
    // Check if user exists
    const userExists = await getUserById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({
        isPaid,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isPaid: updatedUser.isPaid,
      expiryDate: updatedUser.expiryDate
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    return res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get user activities
router.get('/:id/activities', hasRole(['admin', 'member']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    // Check if user exists
    const userExists = await getUserById(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Regular users can only view their own activities
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view these activities' });
    }
    
    const activities = await db.select()
      .from(jobActivityLogs)
      .where(eq(jobActivityLogs.consultantId, userId))
      .orderBy(desc(jobActivityLogs.timestamp))
      .limit(limit)
      .offset(offset);
      
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Get user activities error:', error);
    return res.status(500).json({ error: 'Failed to fetch user activities' });
  }
});

// ADMIN ONLY - Get all users
router.get('/', hasRole('admin'), async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isPaid: users.isPaid,
      expiryDate: users.expiryDate,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .limit(limit)
    .offset(offset);
    
    return res.status(200).json(allUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;