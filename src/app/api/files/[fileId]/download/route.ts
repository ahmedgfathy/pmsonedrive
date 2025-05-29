import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { FileService } from '@/lib/services/file.service';
import { ActivityService } from '@/lib/services/activity.service';
import { getClientIp } from '@/lib/utils/clientIp';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Get authorization header
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token provided' }, { status: 401 });
    }

    // Verify token and get user
    let tokenData;
    try {
      tokenData = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = tokenData.userId;
    const fileId = params.fileId;
    const fileService = new FileService();
    const activityService = new ActivityService();
    const ipAddress = getClientIp(request);

    // Get file from database
    const file = await fileService.getFileById(fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access
    const hasAccess = await fileService.checkFileAccess(fileId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
      // Read the file
      const fileContent = await readFile(file.path);

      // Log the download activity
      await activityService.logFileActivity(
        fileId,
        userId,
        'download',
        ipAddress
      );

      // Return file with appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', file.type || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
      headers.set('Content-Length', file.size.toString());

      return new NextResponse(fileContent, {
        status: 200,
        headers
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json(
        { error: 'Error reading file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error downloading file' },
      { status: 500 }
    );
  }
}
