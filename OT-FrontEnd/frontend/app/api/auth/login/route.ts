import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Dummy user database
const dummyUsers = [
  { id: 1, name: 'Test User', email: 'test@example.com', password: 'password123', role: 'user' }
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Find user by email and password
    const user = dummyUsers.find(u => 
      u.email === email && 
      u.password === password
    );
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' }, 
        { status: 401 }
      );
    }
    
    // Create session token
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
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
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' }, 
      { status: 500 }
    );
  }
}
