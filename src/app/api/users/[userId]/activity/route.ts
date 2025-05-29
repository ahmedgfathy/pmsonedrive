import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    // Fetch file activities (dummy example, replace with your own logic)
    // You may want to join with a file_activity or audit table if you have one
    const files = await prisma.file.findMany({
      where: { ownerId: params.userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        // Add more fields as needed
      },
    });
    const fileActivities = files.map(f => ({
      id: f.id,
      fileName: f.name,
      action: 'upload',
      timestamp: f.createdAt,
      ipAddress: 'N/A', // Replace with real IP if tracked
    }));

    // Fetch deleted files (dummy example, replace with your own logic)
    const deletedFiles: any[] = [];

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
