import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import path from 'path';
import fs from 'fs/promises';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export class FileService {
  private readonly maxStoragePerUser = 5 * 1024 * 1024 * 1024; // 5GB
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
    fs.mkdir(this.uploadsDir, { recursive: true }).catch(console.error);
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[\/\\?%*:|"<>]/g, '-');
  }

  async getUserStorageInfo(userId: string): Promise<{ used: number; total: number }> {
    if (!userId) throw new Error('User ID is required');
    
    const files = await this.prisma.file.findMany({
      where: { ownerId: userId },
      select: { size: true }
    });

    const usedStorage = files.reduce((total: number, file: { size?: number }) => total + (file.size || 0), 0);
    return {
      used: usedStorage,
      total: this.maxStoragePerUser
    };
  }

  async getFolderPath(userId: string, folderId?: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!user) throw new Error('User not found');

    // Create a consistent path structure that won't change with time
    const userFolder = path.join(this.uploadsDir, userId);
    
    if (folderId) {
      // If it's in a folder, use the folder's path
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId }
      });
      
      if (!folder) throw new Error('Folder not found');
      return folder.path;
    }

    // Return the user's root folder path
    return userFolder;
  }

  async createUserStorage(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required');
    const userFolder = path.join(this.uploadsDir, userId);
    await fs.mkdir(userFolder, { recursive: true });
  }

  async uploadFile(file: UploadedFile, userId: string, folderId?: string) {
    if (!file || !userId) throw new Error('File and user ID are required');
    if (!file.size) throw new Error('File size is required');
    if (!file.name) throw new Error('File name is required');
    if (file.size <= 0) throw new Error('File size must be greater than 0');

    try {
      // Check storage limit
      const { used, total } = await this.getUserStorageInfo(userId);
      const availableSpace = total - used;
      if (file.size > availableSpace) {
        throw new Error(`Storage limit exceeded. Available: ${this.formatBytes(availableSpace)}, Required: ${this.formatBytes(file.size)}`);
      }

      // Get base folder path
      const basePath = await this.getFolderPath(userId, folderId);
      
      // Create a unique filename
      const sanitizedName = this.sanitizeFileName(file.name);
      const timestamp = Date.now();
      const filename = `${timestamp}-${sanitizedName}`;
      
      // Create paths
      const relativePath = path.join(folderId || userId, filename);
      const fullPath = path.join(basePath, filename);

      try {
        // Ensure the directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        // Write the file
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(fullPath, buffer);

        // Create database record using a transaction to ensure consistency
        const result = await this.prisma.$transaction(async (tx: any) => {
          const newFile = await tx.file.create({
            data: {
              name: sanitizedName,
              path: relativePath,
              size: file.size,
              type: file.type || 'application/octet-stream',
              owner: {
                connect: { id: userId }
              },
              ...(folderId ? {
                folder: {
                  connect: { id: folderId }
                }
              } : {}),
              createdAt: new Date(timestamp),
              updatedAt: new Date(timestamp)
            },
            include: {
              owner: true,
              folder: true
            }
          });

          return newFile;
        });

        return result;
      } catch (error) {
        // Clean up file if something failed
        await fs.unlink(fullPath).catch(console.error);
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to upload file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createFolder(name: string, userId: string, parentId?: string) {
    if (!name || !userId) throw new Error('Folder name and user ID are required');

    try {
      // If parentId is provided, verify folder exists and user has access
      if (parentId) {
        const parentFolder = await this.prisma.folder.findFirst({
          where: {
            id: parentId,
            OR: [
              { ownerId: userId },
              {
                shares: {
                  some: {
                    sharedWithId: userId,
                    permissions: 'write',
                    expiresAt: {
                      gt: new Date()
                    }
                  }
                }
              }
            ]
          }
        });

        if (!parentFolder) {
          throw new Error('Parent folder not found or no write access');
        }
      }

      const folderPath = await this.getFolderPath(userId, parentId);

      // Create physical folder
      await fs.mkdir(folderPath, { recursive: true });

      // Create database record using a transaction
      const result = await this.prisma.$transaction(async (tx: any) => {
        const newFolder = await tx.folder.create({
          data: {
            name,
            path: folderPath,
            owner: {
              connect: { id: userId }
            },
            ...(parentId ? {
              parent: {
                connect: { id: parentId }
              }
            } : {})
          },
          include: {
            owner: true,
            parent: true,
            files: true,
            subfolders: true
          }
        });

        return newFolder;
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFolderContents(folderId: string | null, userId: string) {
    if (!userId) throw new Error('User ID is required');

    const files = await this.prisma.file.findMany({
      where: {
        OR: [
          { ownerId: userId, folderId: folderId || null },
          {
            shares: {
              some: {
                sharedWithId: userId,
                AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }]
              }
            },
            folderId: folderId || null,
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format dates and add human-readable timestamp
    const formattedFiles = files.map((file: any) => {
      const createdAt = new Date(file.createdAt);
      const updatedAt = new Date(file.updatedAt);
      return {
        ...file,
        uploadedAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        formattedDate: this.formatDate(updatedAt),
        formattedSize: this.formatBytes(file.size)
      };
    });

    const folders = await this.prisma.folder.findMany({
      where: {
        OR: [
          { ownerId: userId, parentId: folderId || null },
          {
            shares: {
              some: {
                sharedWithId: userId,
                AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }]
              }
            },
            parentId: folderId || null,
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            files: true,
            subfolders: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format dates for folders
    const formattedFolders = folders.map((folder: any) => {
      const createdAt = new Date(folder.createdAt);
      const updatedAt = new Date(folder.updatedAt);
      
      return {
        ...folder,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        formattedDate: this.formatDate(updatedAt)
      };
    });

    return {
      files: formattedFiles,
      folders: formattedFolders
    };
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  async getFileById(fileId: string) {
    return await this.prisma.file.findUnique({
      where: { id: fileId }
    });
  }

  async checkFileAccess(fileId: string, userId: string): Promise<boolean> {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        OR: [
          { ownerId: userId },
          {
            shares: {
              some: {
                sharedWithId: userId,
                AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }]
              }
            }
          }
        ]
      }
    });
    return !!file;
  }
}
