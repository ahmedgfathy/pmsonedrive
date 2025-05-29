import { prisma } from '@/lib/prisma';
import type { Prisma, File, User } from '@prisma/client';

type FileInfo = Pick<File, 'id' | 'name' | 'size' | 'type' | 'createdAt'>;

interface ActivityInput {
  fileId: string;
  userId: string;
  action: 'upload' | 'download' | 'share' | 'delete';
  ipAddress: string;
  details?: string;
}

interface FileActivity {
  id: string;
  fileId: string;
  file: FileInfo | null;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'employeeId'>;
  action: string;
  ipAddress: string;
  details?: string | null;
  timestamp: Date;
}

export class ActivityService {
  async logFileActivity(
    fileId: string,
    userId: string,
    action: ActivityInput['action'],
    ipAddress: string,
    details?: string
  ) {
    try {
      // For delete actions, store file info in details
      if (action === 'delete') {
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          select: { name: true, size: true, type: true }
        });
        if (file) {
          details = `${file.name} - ${file.size} - ${file.type}`;
        }
      }

      return await prisma.$transaction(async (tx) => {
        // @ts-ignore - Prisma types not fully updated yet
        const activity = await tx.activity.create({
          data: {
            userId,
            fileId,
            action,
            ipAddress,
            details,
          }
        });

        return activity;
      });
    } catch (error) {
      console.error('Error logging file activity:', error);
      throw new Error('Failed to log file activity');
    }
  }

  async getUserActivities(userId: string): Promise<FileActivity[]> {
    try {
      // @ts-ignore - Prisma types not fully updated yet
      const activities = await prisma.activity.findMany({
        where: {
          userId
        },
        include: {
          file: {
            select: {
              id: true,
              name: true,
              size: true,
              type: true,
              createdAt: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return activities.map((activity: any): FileActivity => {
        if (activity.action === 'delete' && !activity.file && activity.details) {
          const [name = 'Unknown file', sizeStr = '0', type = 'unknown'] = activity.details.split(' - ');
          const fileInfo: FileInfo = {
            id: activity.fileId,
            name,
            size: parseInt(sizeStr),
            type,
            createdAt: activity.timestamp
          };

          return {
            ...activity,
            file: fileInfo
          };
        }
        return activity;
      });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw new Error('Failed to fetch user activities');
    }
  }
}
