import { mkdir } from 'fs/promises';
import path from 'path';

export function getUploadPath(userId: string, originalFilename: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = Date.now();
  
  // Clean the filename to remove any potentially problematic characters
  const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Construct the path: uploads/userId/year/month/day/timestamp-filename
  const relativePath = path.join(
    'uploads',
    userId,
    year,
    month,
    day
  );
  
  const filename = `${timestamp}-${cleanFilename}`;
  
  return {
    relativePath,
    fullPath: path.join(relativePath, filename),
    filename
  };
}

export async function ensureUploadPath(relativePath: string): Promise<void> {
  // Ensure the directory exists
  await mkdir(relativePath, { recursive: true });
}
