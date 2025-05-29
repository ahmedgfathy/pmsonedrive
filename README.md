# PMDrive - Modern File Management

PMDrive is a modern file management system built with Next.js, designed to provide a seamless and intuitive file upload and management experience.

![PMS-Drive](public/screenshot.png)

## ✨ Features

- 📤 Single & multi-file uploads with drag-and-drop support
- 📁 Organized file storage with consistent paths
- 🔄 Real-time file list updates
- 💾 Persistent storage across page refreshes and sessions
- 🎯 Modern, responsive UI
- ⚡ Fast file operations with transaction support
- 🔒 Secure file handling

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pmsonedrive.git
cd pmsonedrive
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org)
- **Database**: Prisma with SQLite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **File Processing**: Node.js File System API
- **State Management**: React Server Components + Client Hooks

## 📝 Project Structure

```
src/
├── app/               # Next.js App Router pages and layouts
├── components/        # Reusable UI components
├── lib/              # Core utilities and services
│   └── services/     # Business logic and data access
└── types/            # TypeScript type definitions
```

## 🔧 Configuration

Key configuration options are available in:
- `.env.local` - Environment variables
- `prisma/schema.prisma` - Database schema
- `src/lib/config.ts` - Application settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using [Next.js](https://nextjs.org)
