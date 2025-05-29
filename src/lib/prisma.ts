import { Prisma, PrismaClient } from '@prisma/client'

// Include all Prisma client extensions and model types
export type ExtendedPrismaClient = PrismaClient

// Add Prisma client to the global type
declare global {
  var prisma: ExtendedPrismaClient | undefined
}

// Create new client with extensions if it doesn't exist
const prismaInstance = global.prisma || new PrismaClient() as ExtendedPrismaClient

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaInstance
}

export const prisma = prismaInstance
