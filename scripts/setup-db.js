const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'zerocall',
      database: 'pmsonedrive'
    });

    console.log('Connected to database');

    // Create User table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(191) NOT NULL,
        name VARCHAR(191),
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3)
      )
    `);

    // Create File table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS File (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        path VARCHAR(191) NOT NULL,
        size INT NOT NULL,
        type VARCHAR(191) NOT NULL,
        ownerId VARCHAR(191) NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3),
        FOREIGN KEY (ownerId) REFERENCES User(id)
      )
    `);

    console.log('Tables created successfully');

    // Check if test user exists
    const [existingUsers] = await connection.execute('SELECT id FROM User WHERE email = ?', ['test@example.com']);
    
    if (!existingUsers.length) {
      // Insert test user
      await connection.execute(`
        INSERT INTO User (id, email, password, name, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, ['cus1', 'test@example.com', '$2a$10$iVrIFGrwEJrLky6mGZZBpeGvGrqhEEpXQJVosWPbUgLvL8O862B6.', 'Test User']);
      console.log('Test user created');
    } else {
      console.log('Test user already exists');
    }

    // Verify database contents
    const [users] = await connection.execute('SELECT * FROM User');
    console.log('Users in database:', users);
    
    const [files] = await connection.execute('SELECT * FROM File');
    console.log('Files in database:', files);

    await connection.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
