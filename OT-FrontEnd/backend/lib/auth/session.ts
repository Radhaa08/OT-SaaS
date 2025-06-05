import { compare, hash } from 'bcryptjs';
import { serialize, parse } from 'cookie';
import { NewUser } from '../db/schema';
import { Request, Response } from 'express';

// Make sure AUTH_SECRET is available
if (!process.env.AUTH_SECRET) {
  console.error('AUTH_SECRET environment variable is not set');
  process.exit(1);
}

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

export type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  const { SignJWT } = await import('jose');
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { jwtVerify } = await import('jose');
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionData;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getSession(req: Request): Promise<SessionData | null> {
  const cookies = parse(req.headers.cookie || '');
  const session = cookies.session;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(res: Response, user: NewUser) {
  if (!user.id) {
    throw new Error('User ID is required');
  }
  
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id },
    expires: expiresInOneDay.toISOString(),
  };
  
  const encryptedSession = await signToken(session);
  const cookie = serialize('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

export function clearSession(res: Response) {
  res.setHeader(
    'Set-Cookie', 
    'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
  );
}