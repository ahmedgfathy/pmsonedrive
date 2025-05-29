import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import type { User, File } from '@prisma/client';

export const dynamic = 'force-dynamic';

const TB = Math.pow(1024, 4); // 1 TB in bytes
const GB = Math.pow(1024, 3); // 1 GB in bytes

interface StorageStats {
  userId: string;
  name: string | null;
  email: string;
  employeeId: string;
  usedStorage: number;
  quota: number;
  usagePercentage: number;
  fileCount: number;
  oldFiles: number;
  lastActive: Date | null;
}

interface SystemStats {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  utilizationPercentage: number;
  totalUsers: number;
  activeUsers: number;
}

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
            updatedAt: true
          }
        }
      }
    });

    const totalStorage = 5 * TB; // 5TB as default total storage
    let usedStorage = 0;
    const defaultQuota = 5 * GB; // 5GB default quota

    const userStats: StorageStats[] = users.map(user => {
      const userFiles = user.files || [];
      const userUsedStorage = userFiles.reduce((acc: number, file) => acc + Number(file.size), 0);
      usedStorage += userUsedStorage;

      // Calculate storage metrics
      const userQuota = Number(user.storageQuota || defaultQuota);
      const usagePercentage = userFiles.length > 0 
        ? (userUsedStorage * 100) / userQuota
        : 0;

      // Get file age statistics
      const now = new Date();
      const fileAges = userFiles.map(file => {
        const age = now.getTime() - new Date(file.createdAt).getTime();
        return Math.floor(age / (1000 * 60 * 60 * 24)); // Age in days
      });

      const oldFiles = fileAges.filter(age => age > 90).length; // Files older than 90 days

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        usedStorage: userUsedStorage,
        quota: userQuota,
        usagePercentage,
        fileCount: userFiles.length,
        oldFiles,
        lastActive: userFiles.length > 0 
          ? new Date(Math.max(...userFiles.map(f => new Date(f.updatedAt || f.createdAt).getTime())))
          : null
      };
    });

    // Sort users by usage percentage in descending order
    userStats.sort((a, b) => b.usagePercentage - a.usagePercentage);

    // Calculate system-wide statistics
    const systemStats: SystemStats = {
      totalStorage,
      usedStorage,
      availableStorage: totalStorage - usedStorage,
      utilizationPercentage: (usedStorage * 100) / totalStorage,
      totalUsers: users.length,
      activeUsers: userStats.filter(u => u.lastActive && 
        (new Date().getTime() - u.lastActive.getTime()) < 30 * 24 * 60 * 60 * 1000 // Active in last 30 days
      ).length
    };

    return NextResponse.json({
      systemStats,
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
