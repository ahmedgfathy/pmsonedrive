import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  try {
    // Clean up existing data
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
      name: 'Test User'
    },
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User'
    }
  });

  console.log('Created test user:', {
    id: user.id,
    email: user.email,
    name: user.name
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
