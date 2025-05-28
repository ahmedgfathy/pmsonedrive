import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  // Check admin token
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const admin = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!admin || !admin.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Fetch all users and their files
  const users = await prisma.user.findMany({
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      isAdmin: true,
      files: {
        select: {
          id: true,
          name: true,
          size: true,
          type: true,
          createdAt: true,
        },
      },
    },
  });
  return NextResponse.json({ users });
}
