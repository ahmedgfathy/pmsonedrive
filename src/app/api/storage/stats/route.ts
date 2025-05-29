import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Get all users with their files and additional details
    const users = await prisma.user.findMany({
      include: {
        files: {
          select: {
            id: true,
            size: true,
            createdAt: true,
            lastAccessed: true
          }
        }
      }
    });
    const totalStorage = 5n * 1024n * 1024n * 1024n * 1024n; // 5TB as default total storage
    let usedStorage = 0n;

    const userStats = users.map(user => {
      const userUsedStorage = user.files.reduce((acc, file) => acc + BigInt(file.size), 0n);
      usedStorage += userUsedStorage;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        usedStorage: Number(userUsedStorage),
        quota: user.storageQuota || Number(totalStorage / BigInt(users.length)), // Default quota is total storage divided by number of users
        fileCount: user.files.length,
      };
    });

    return NextResponse.json({
      totalStorage: Number(totalStorage),
      usedStorage: Number(usedStorage),
      userStats,
    });

  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage statistics' },
      { status: 500 }
    );
  }
}
