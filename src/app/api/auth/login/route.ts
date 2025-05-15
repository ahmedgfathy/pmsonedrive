import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Login attempt for:', { employeeId: body.employeeId, passwordLength: body.password?.length });

    if (!body.employeeId || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and password are required' },
        { status: 400 }
      );
    }

    const { employeeId, password } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { employeeId }
    });
    
    console.log('User lookup result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      employeeId: user.employeeId
    });

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
