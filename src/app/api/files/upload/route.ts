import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { FileService } from '@/lib/services/file.service';

// Add types for multipart form data
type FileData = {
  filename: string;
  data: Buffer;
  size: number;
  type: string;
};

export async function POST(request: NextRequest) {
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
    const fileService = new FileService();

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folderId = formData.get('folderId') as string | undefined;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate each file
    for (const file of files) {
      if (!file.size || !file.name) {
        return NextResponse.json({ 
          error: 'Invalid file data',
          details: `File ${file.name || 'unknown'} has invalid size or name`
        }, { status: 400 });
      }
    }

    // Initialize user storage if needed
    await fileService.createUserStorage(userId);

    // Upload each file with detailed error tracking
    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const fileRecord = await fileService.uploadFile({
          name: file.name,
          size: file.size,
          type: file.type,
          arrayBuffer: () => file.arrayBuffer()
        }, userId, folderId);
        
        uploadedFiles.push(fileRecord);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    // If no files were uploaded successfully, return error
    if (uploadedFiles.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to upload files',
        errors
      }, { status: 500 });
    }

    // Get final storage info
    const { used: usedStorage, total: maxStorage } = await fileService.getUserStorageInfo(userId);

    return NextResponse.json({ 
      message: errors.length === 0 ? 'All files uploaded successfully' : 'Some files failed to upload',
      files: uploadedFiles,
      totalSize: usedStorage,
      maxStorage,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error uploading files' },
      { status: 500 }
    );
  }
}
