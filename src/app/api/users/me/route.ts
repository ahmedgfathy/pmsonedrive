import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  // Check auth token
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Fetch user with admin status
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      employeeId: true,
      email: true,
      name: true,
      isAdmin: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if user is admin
  if (!user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(user);
}
