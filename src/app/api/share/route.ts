import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { FileService } from '@/lib/services/file.service';

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
    const fileService = new FileService();

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
        sharedWithId,
        permissions,
        expiresAt ? new Date(expiresAt) : undefined
      );
    } else if (type === 'folder') {
      share = await fileService.shareFolder(
        id,
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
