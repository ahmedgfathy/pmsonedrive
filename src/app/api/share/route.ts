import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { FileService as FileServiceV2 } from '@/lib/services/file.service.v2';
import { ActivityService } from '@/lib/services/activity.service';
import { getClientIp } from '@/lib/utils/clientIp';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user
    let tokenData;
    try {
      tokenData = verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = tokenData.userId;
    const fileService = new FileServiceV2();
    const activityService = new ActivityService();
    const ipAddress = getClientIp(request);

    // Parse request body
    const { type, id, sharedWithId, permissions, expiresAt } = await request.json();

    if (!type || !id || !sharedWithId || !permissions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let share;
    if (type === 'file') {
      share = await fileService.shareFile(
        id,
        userId,
        sharedWithId,
        permissions,
        expiresAt ? new Date(expiresAt) : undefined
      );

      // Log the share activity
      await activityService.logFileActivity(
        id,
        userId,
        'share',
        ipAddress,
        `Shared with user ${sharedWithId} with ${permissions} permissions`
      );
    } else if (type === 'folder') {
      share = await fileService.shareFolder(
        id,
        userId,
        sharedWithId,
        permissions,
        expiresAt ? new Date(expiresAt) : undefined
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid share type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `${type} shared successfully`,
      share
    });
  } catch (error) {
    console.error('Error sharing item:', error);
    return NextResponse.json(
      { error: 'Error sharing item' },
      { status: 500 }
    );
  }
}
