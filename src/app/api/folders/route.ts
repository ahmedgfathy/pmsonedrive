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
    const { name, parentId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Create folder
    const folder = await fileService.createFolder(name, userId, parentId);

    return NextResponse.json({
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Error creating folder' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get folder ID from URL
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    // Delete folder
    await fileService.deleteFolder(folderId, userId);

    return NextResponse.json({
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Error deleting folder' },
      { status: 500 }
    );
  }
}
