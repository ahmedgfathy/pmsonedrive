import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ActivityService } from '@/lib/services/activity.service';

interface FileActivity {
  id: string;
  fileId: string;
  file: {
    name: string;
    size: number;
  };
  action: string;
  ipAddress: string;
  details?: string | null;
  timestamp: Date;
}

export async function GET(
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

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Initialize activity service
    const activityService = new ActivityService();
    
    // Fetch file activities
    const activities = await activityService.getUserActivities(params.userId);
    const fileActivities = activities.map((a: FileActivity) => ({
      id: a.id,
      fileName: a.file.name,
      action: a.action,
      timestamp: a.timestamp,
      ipAddress: a.ipAddress,
      details: a.details,
    }));

    // Fetch deleted files - now part of activities where action is 'delete'
    const deletedFiles = activities
      .filter((a: FileActivity) => a.action === 'delete')
      .map((a: FileActivity) => ({
        id: a.fileId,
        fileName: a.file.name,
        size: a.file.size,
        deletedAt: a.timestamp,
      }));

    return NextResponse.json({
      userId: user.id,
      userName: user.name,
      email: user.email,
      employeeId: user.employeeId,
      fileActivities,
      deletedFiles,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
