import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  // Clean up existing data in the correct order
  await prisma.sharedFile.deleteMany({});
  await prisma.sharedFolder.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.user.deleteMany({});

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
  } catch (e) {
    console.error('Database connection failed:', e);
    throw e;
  }

  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash('test123', 10);
  console.log('Password hashed successfully');

  console.log('Creating test user...');
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      password: hashedPassword,
      name: 'Test User',
      employeeId: 'EMP001'
    },
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      employeeId: 'EMP001'
    }
  });

  console.log('Created test user:', {
    id: user.id,
    email: user.email,
    name: user.name
  });

  // Create admin user
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: adminHashedPassword,
      name: 'Admin User',
      employeeId: 'ADMIN001',
      isAdmin: true
    },
    create: {
      email: 'admin@example.com',
      password: adminHashedPassword,
      name: 'Admin User',
      employeeId: 'ADMIN001',
      isAdmin: true
    }
  });
}

main()
  .catch(e => {
    console.error('Error creating test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
