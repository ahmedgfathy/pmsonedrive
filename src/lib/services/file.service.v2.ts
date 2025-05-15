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

  async getUserStorageInfo(userId: string): Promise<{ used: number; total: number }> {
    if (!userId) throw new Error('User ID is required');
    
    const files = await this.prisma.file.findMany({
      where: { ownerId: userId },
      select: { size: true }
    });

    const usedStorage = files.reduce((total, file) => total + file.size, 0);
    return {
      used: usedStorage,
      total: this.maxStoragePerUser
    };
  }

  async getFolderPath(userId: string, folderId?: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true }
    });
    if (!user) throw new Error('User not found');

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const week = Math.ceil(date.getDate() / 7);
    const day = date.getDate();

    return path.join(
      this.uploadsDir,
      user.employeeId,
      year.toString(),
      month.toString(),
      `week${week}`,
      day.toString(),
      folderId || ''
    );
  }

  async createUserStorage(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required');
    const basePath = await this.getFolderPath(userId);
    await fs.mkdir(basePath, { recursive: true });
  }

  async createFolder(name: string, userId: string, parentId?: string) {
    if (!name || !userId) throw new Error('Folder name and user ID are required');

    // If parentId is provided, verify it exists and user has access
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
                  expiresAt: { gt: new Date() }
                }
              }
            }
          ]
        }
      });
      if (!parentFolder) throw new Error('Parent folder not found or no write access');
    }

    const folderPath = await this.getFolderPath(userId, parentId);

    try {
      // Create physical folder
      await fs.mkdir(folderPath, { recursive: true });

      // Create in database
      return await this.prisma.folder.create({
        data: {
          name,
          path: folderPath,
          ownerId: userId,
          parentId
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
              employeeId: true
            }
          }
        }
      });
    } catch (error) {
      // Clean up folder if database operation fails
      await fs.rm(folderPath, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  async uploadFile(file: UploadedFile, userId: string, folderId?: string) {
    if (!file || !userId) throw new Error('File and user ID are required');

    // Check storage limit
    const { used, total } = await this.getUserStorageInfo(userId);
    if (used + file.size > total) {
      throw new Error('Storage limit exceeded');
    }

    // If folderId is provided, verify it exists and user has access
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { 
          id: folderId,
          OR: [
            { ownerId: userId },
            {
              shares: {
                some: {
                  sharedWithId: userId,
                  permissions: 'write',
                  expiresAt: { gt: new Date() }
                }
              }
            }
          ]
        }
      });
      if (!folder) throw new Error('Folder not found or no write access');
    }

    const folderPath = await this.getFolderPath(userId, folderId);
    const filename = `${Date.now()}-${file.name}`;
    const filePath = path.join(folderPath, filename);

    try {
      // Create folder if it doesn't exist
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Save file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // Save to database
      return await this.prisma.file.create({
        data: {
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
          ownerId: userId,
          folderId
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
              employeeId: true
            }
          }
        }
      });
    } catch (error) {
      // Clean up file if database operation fails
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  }

  async shareFile(fileId: string, ownerId: string, sharedWithId: string, permissions: 'read' | 'write', expiresAt?: Date) {
    if (!fileId || !sharedWithId) throw new Error('File ID and shared user ID are required');

    // Verify file exists and user owns it
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId
      }
    });
    if (!file) throw new Error('File not found or access denied');

    // Verify target user exists
    const sharedWithUser = await this.prisma.user.findUnique({
      where: { id: sharedWithId }
    });
    if (!sharedWithUser) throw new Error('User to share with not found');

    if (ownerId === sharedWithId) {
      throw new Error('Cannot share with yourself');
    }

    return this.prisma.sharedFile.create({
      data: {
        fileId,
        sharedWithId,
        permissions,
        externalLink: this.generateShareLink(),
        expiresAt
      }
    });
  }

  async shareFolder(folderId: string, ownerId: string, sharedWithId: string, permissions: 'read' | 'write', expiresAt?: Date) {
    if (!folderId || !sharedWithId) throw new Error('Folder ID and shared user ID are required');

    // Verify folder exists and user owns it
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId
      }
    });
    if (!folder) throw new Error('Folder not found or access denied');

    // Verify target user exists
    const sharedWithUser = await this.prisma.user.findUnique({
      where: { id: sharedWithId }
    });
    if (!sharedWithUser) throw new Error('User to share with not found');

    if (ownerId === sharedWithId) {
      throw new Error('Cannot share with yourself');
    }

    return this.prisma.sharedFolder.create({
      data: {
        folderId,
        sharedWithId,
        permissions,
        externalLink: this.generateShareLink(),
        expiresAt
      }
    });
  }

  private generateShareLink(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length: 32 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        ownerId: userId
      }
    });

    if (!file) throw new Error('File not found or no access');

    try {
      // Delete physical file
      await fs.unlink(file.path);

      // Delete from database (cascade will handle shares)
      await this.prisma.file.delete({
        where: { id: fileId }
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async deleteFolder(folderId: string, userId: string): Promise<void> {
    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: userId
      }
    });

    if (!folder) throw new Error('Folder not found or no access');

    try {
      await this.deleteFilesInFolder(folderId);
      await fs.rm(folder.path, { recursive: true, force: true });
      await this.prisma.folder.delete({
        where: { id: folderId }
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  private async deleteFilesInFolder(folderId: string): Promise<void> {
    const files = await this.prisma.file.findMany({
      where: { folderId }
    });

    for (const file of files) {
      await fs.unlink(file.path).catch(console.error);
    }

    await this.prisma.file.deleteMany({
      where: { folderId }
    });

    const subfolders = await this.prisma.folder.findMany({
      where: { parentId: folderId }
    });

    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder.id, subfolder.ownerId);
    }
  }

  async listFolderContents(folderId: string | null, userId: string) {
    if (!userId) throw new Error('User ID is required');

    // If folderId is provided, verify access
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: {
          id: folderId,
          OR: [
            { ownerId: userId },
            {
              shares: {
                some: {
                  sharedWithId: userId,
                  expiresAt: { gt: new Date() }
                }
              }
            }
          ]
        }
      });
      if (!folder) throw new Error('Folder not found or no access');
    }

    const [files, folders] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          folderId,
          OR: [
            { ownerId: userId },
            {
              shares: {
                some: {
                  sharedWithId: userId,
                  expiresAt: { gt: new Date() }
                }
              }
            }
          ]
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
              employeeId: true
            }
          },
          shares: true
        }
      }),
      this.prisma.folder.findMany({
        where: {
          parentId: folderId,
          OR: [
            { ownerId: userId },
            {
              shares: {
                some: {
                  sharedWithId: userId,
                  expiresAt: { gt: new Date() }
                }
              }
            }
          ]
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true,
              employeeId: true
            }
          },
          shares: true
        }
      })
    ]);

    return { files, folders };
  }
}
