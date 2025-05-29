import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
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

    // Get request body
    const { quota } = await request.json();
    if (quota === undefined || quota < 0) {
      return NextResponse.json({ error: 'Invalid quota value' }, { status: 400 });
    }

    // Update user's storage quota
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        storageQuota: quota
      },
      include: {
        files: true
      }
    });

    return NextResponse.json({
      message: 'Storage quota updated successfully',
      userId: updatedUser.id,
      newQuota: updatedUser.storageQuota
    });

  } catch (error) {
    console.error('Error updating storage quota:', error);
    return NextResponse.json(
      { error: 'Failed to update storage quota' },
      { status: 500 }
    );
  }
}