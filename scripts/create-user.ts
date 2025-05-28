import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating test user...')
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: '$2a$10$iVrIFGrwEJrLky6mGZZBpeGvGrqhEEpXQJVosWPbUgLvL8O862B6.', // hashed 'test123'
      name: 'Test User',
      employeeId: 'EMP001'
    }
  })
  
  console.log('Created user:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
