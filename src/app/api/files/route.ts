import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { FileService } from '@/lib/services/file.service';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    // Get folder contents
    const { files, folders } = await fileService.listFolderContents(
      folderId,
      userId
    );

    // Get storage info
    const { used: totalSize, total: maxStorage } = await fileService.getUserStorageInfo(userId);

    return NextResponse.json({
      files,
      folders,
      totalSize,
      maxStorage
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Error fetching files' },
      { status: 500 }
    );
  }
}
