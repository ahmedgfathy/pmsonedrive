-- Disable foreign key checks (for MySQL)
SET FOREIGN_KEY_CHECKS=0;

-- Drop existing tables first (in reverse order of dependencies)
DROP TABLE IF EXISTS `FileActivity`;
DROP TABLE IF EXISTS `SharedFolder`;
DROP TABLE IF EXISTS `SharedFile`;
DROP TABLE IF EXISTS `File`;
DROP TABLE IF EXISTS `Folder`;
DROP TABLE IF EXISTS `User`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- Create tables
CREATE TABLE `User` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `isAdmin` boolean NOT NULL DEFAULT false,
  `storageQuota` bigint DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_employeeId_key` (`employeeId`),
  UNIQUE KEY `User_email_key` (`email`)
);

CREATE TABLE `Folder` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `path` varchar(191) NOT NULL,
  `ownerId` varchar(191) NOT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Folder_ownerId_fkey` (`ownerId`),
  KEY `Folder_parentId_fkey` (`parentId`),
  CONSTRAINT `Folder_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`),
  CONSTRAINT `Folder_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Folder` (`id`)
);

CREATE TABLE `File` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `path` varchar(191) NOT NULL,
  `size` int NOT NULL,
  `type` varchar(191) NOT NULL,
  `ownerId` varchar(191) NOT NULL,
  `folderId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `File_ownerId_fkey` (`ownerId`),
  KEY `File_folderId_fkey` (`folderId`),
  CONSTRAINT `File_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`),
  CONSTRAINT `File_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder` (`id`)
);

CREATE TABLE `SharedFile` (
  `id` varchar(191) NOT NULL,
  `fileId` varchar(191) NOT NULL,
  `sharedWithId` varchar(191) NOT NULL,  
  `permissions` varchar(191) NOT NULL,
  `externalLink` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `SharedFile_fileId_fkey` (`fileId`),
  KEY `SharedFile_sharedWithId_fkey` (`sharedWithId`),
  CONSTRAINT `SharedFile_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File` (`id`),
  CONSTRAINT `SharedFile_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `User` (`id`)
);

CREATE TABLE `SharedFolder` (
  `id` varchar(191) NOT NULL,
  `folderId` varchar(191) NOT NULL,
  `sharedWithId` varchar(191) NOT NULL,
  `permissions` varchar(191) NOT NULL,
  `externalLink` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `SharedFolder_folderId_fkey` (`folderId`),
  KEY `SharedFolder_sharedWithId_fkey` (`sharedWithId`),
  CONSTRAINT `SharedFolder_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder` (`id`),
  CONSTRAINT `SharedFolder_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `User` (`id`)
);

CREATE TABLE `FileActivity` (
  `id` varchar(191) NOT NULL,  
  `fileId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL, -- upload, download, share, delete
  `ipAddress` varchar(191) NOT NULL,
  `details` varchar(191) DEFAULT NULL, -- Additional info, like share target
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `FileActivity_fileId_fkey` (`fileId`),
  KEY `FileActivity_userId_fkey` (`userId`),
  CONSTRAINT `FileActivity_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FileActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
);
