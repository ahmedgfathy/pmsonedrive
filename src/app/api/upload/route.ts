import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { FileService } from '@/lib/services/file.service';
import { getClientIp } from '@/lib/utils/clientIp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get('file') as File;
    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get file metadata
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    const fileService = new FileService();

    // Create base directory structure
    const userUploadPath = `uploads/${payload.userId}/${year}/${month}/${day}`;
    
    // Handle file upload
    try {
      const file = await fileService.uploadFile(
        {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type,
          arrayBuffer: () => uploadedFile.arrayBuffer()
        },
        payload.userId,
        userUploadPath
      );

      return NextResponse.json({
        status: 'success',
        file: {
          id: file.id,
          name: file.name,
          path: file.path,
          size: file.size,
          uploadedAt: file.createdAt
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Upload failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request handling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
