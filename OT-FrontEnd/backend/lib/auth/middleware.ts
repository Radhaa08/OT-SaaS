import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../db/schema';
import { getSession } from './session';
import { getUserById } from '../db/queries';
import jwt from 'jsonwebtoken';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

// This middleware will check for auth but not require it
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { id: number };
    
    if (decoded && decoded.id) {
      const user = await getUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // We don't respond with an error for optional auth
    next();
  }
};

// This middleware will require authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// This middleware will require admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  next();
};

// Express middleware to verify authentication
export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get session from cookies
    const session = await getSession(req);
    
    // No session found
    if (!session || !session.user || !session.user.id) {
      return res.status(401).json({ error: 'Unauthorized - No valid session' });
    }
    
    // Session expired
    if (new Date(session.expires) < new Date()) {
      return res.status(401).json({ error: 'Unauthorized - Session expired' });
    }
    
    // Get user from database
    const user = await getUserById(session.user.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized - Authentication failed' });
  }
}

// Role-based authorization middleware
export function hasRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
}

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    const formDataObj: { [key: string]: FormDataEntryValue } = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value;
    });
    const result = schema.safeParse(formDataObj);
    if (!result.success) {
      return { error: result.error.errors[0].message } as T;
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData, req: Request): Promise<T> => {
    if (!req.user) {
      throw new Error('User is not authenticated');
    }

    const formDataEntries: [string, FormDataEntryValue][] = [];
    formData.forEach((value, key) => {
      formDataEntries.push([key, value]);
    });
    const result = schema.safeParse(Object.fromEntries(formDataEntries));
    if (!result.success) {
      return { error: result.error.errors[0].message } as T;
    }

    return action(result.data, formData, req.user);
  };
}