import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
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
  // Prevent admin from deleting themselves
  if (params.userId === admin.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }
  // Delete user and cascade files/folders
  await prisma.user.delete({ where: { id: params.userId } });
  return NextResponse.json({ success: true });
}
