import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Dummy user database
const dummyUsers = [
  { id: 1, name: 'Test User', email: 'test@example.com', password: 'password123', role: 'user' }
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Check if user already exists
    const existingUser = dummyUsers.find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' }, 
        { status: 400 }
      );
    }
    
    // Create new user
    const newUser = {
      id: dummyUsers.length + 1,
      name,
      email,
      password,
      role: 'user'
    };
    
    dummyUsers.push(newUser);
    
    // Create session token
    const token = Buffer.from(JSON.stringify({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    })).toString('base64');
    
    // Set cookie
    const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    cookies().set({
      name: 'session',
      value: token,
      httpOnly: true,
      expires: expiresInOneDay,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    // Return response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' }, 
      { status: 500 }
    );
  }
}
