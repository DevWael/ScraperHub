# ScraperHub

A modern, real-time web scraping dashboard built with Next.js, TypeScript, and Socket.IO. Features advanced scraping capabilities with real-time progress monitoring, task management, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Real-time Web Scraping**: Advanced web scraping with configurable settings
- **Live Progress Monitoring**: Real-time updates via Socket.IO
- **Task Management**: Create, pause, resume, and manage scraping tasks
- **Task History**: View complete history of all task runs
- **Download Results**: Download scraping results as ZIP files
- **Dark Mode Support**: Automatic theme switching based on OS preferences

### User Interface
- **Modern Dashboard**: Clean, responsive design with Tailwind CSS
- **Real-time Statistics**: Live statistics and performance metrics
- **Task Cards**: Visual task management with status indicators
- **Modal Interfaces**: Detailed task information and settings
- **Progress Tracking**: Visual progress bars and time estimates

### Technical Features
- **TypeScript**: Full type safety and better development experience
- **SOLID Principles**: Well-structured, maintainable code
- **Unit Testing**: Comprehensive test coverage with Jest
- **Error Handling**: Robust error handling and user feedback
- **Performance Optimized**: Efficient rendering and state management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Real-time**: Socket.IO
- **Database**: SQLite with Better-SQLite3
- **Testing**: Jest, React Testing Library
- **Build Tool**: Next.js (Webpack)
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd scraperhub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=./data/scraper.db

# Socket.IO
SOCKET_PORT=3001

# Development
NODE_ENV=development
```

### 4. Initialize Database

```bash
npm run db:init
```

### 5. Start Development Servers

#### Option 1: Start both servers together (Recommended)
```bash
# Using the startup script
./start-dev.sh

# Or using npm directly
npm run dev:full
```

#### Option 2: Start servers separately
```bash
# Terminal 1: Start Next.js development server
npm run dev

# Terminal 2: Start Socket.IO server
npm run socket
```

The application will be available at `http://localhost:3000`
The Socket.IO server will be available at `http://localhost:3001`

## 📁 Project Structure

```
scraperhub/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── NewTaskModal.tsx   # Task creation modal
│   ├── TaskCard.tsx       # Individual task card
│   ├── TaskDetailsModal.tsx # Task details view
│   ├── TaskHistoryModal.tsx # Task history view
│   ├── TaskSettingsModal.tsx # Task settings
│   ├── StatisticsPanel.tsx # Statistics dashboard
│   ├── ThemeProvider.tsx  # Dark mode provider
│   └── ThemeToggle.tsx    # Theme toggle button
├── lib/                   # Utility functions
│   ├── database.ts        # Database operations
│   ├── socket-server.ts   # Socket.IO server
│   ├── utils.ts           # Utility functions
│   └── utils.test.ts      # Unit tests
├── types/                 # TypeScript types
│   └── task.ts           # Task-related types
├── data/                  # Data storage
│   ├── downloads/         # Downloaded files
│   ├── tasks/            # Task outputs
│   └── scraper.db        # SQLite database
└── .cursorrules          # Development standards
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and utilities
- **Component Tests**: Test React component behavior
- **Integration Tests**: Test API routes and workflows

## 🎨 Development Standards

This project follows strict development standards defined in `.cursorrules`:

### Code Quality
- **TypeScript**: Strict typing, no `any` types
- **SOLID Principles**: Single responsibility, dependency injection
- **Error Handling**: Comprehensive error handling
- **Performance**: Optimized rendering and state management

### File Organization
- **Components**: One component per file, PascalCase naming
- **API Routes**: RESTful endpoints with proper error handling
- **Types**: Descriptive interfaces and types
- **Utilities**: Reusable functions with JSDoc documentation

### Testing
- **Unit Tests**: All utility functions tested
- **Component Tests**: Behavior testing, not implementation
- **Integration Tests**: API and workflow testing

## 🔧 Configuration

### Task Settings

Tasks can be configured with various settings:

```typescript
interface TaskSettings {
  // Scraping settings
  concurrency: number;        // Number of concurrent requests
  timeout: number;           // Request timeout in seconds
  maxRetries: number;        // Maximum retry attempts
  maxPages: number;          // Maximum pages to scrape
  
  // Output settings
  format: 'md' | 'html' | 'json';  // Output format
  downloadImages: boolean;   // Download images
  includeMetadata: boolean;  // Include page metadata
  
  // Content filtering
  excludePatterns: string[]; // URLs to exclude
  removeElements: string[];  // CSS selectors to remove
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `./data/scraper.db` |
| `SOCKET_PORT` | Socket.IO server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

## 📊 API Reference

### Task Management

#### Create Task
```http
POST /api/scraper/start
Content-Type: application/json

{
  "url": "https://example.com",
  "settings": {
    "concurrency": 5,
    "maxPages": 100,
    "format": "md"
  }
}
```

#### Get Tasks
```http
GET /api/scraper/start
```

#### Download Results
```http
GET /api/scraper/download/{taskId}
```

### Task Operations

#### Pause Task
```http
POST /api/scraper/pause
Content-Type: application/json

{
  "taskId": "task-uuid"
}
```

#### Resume Task
```http
POST /api/scraper/resume
Content-Type: application/json

{
  "taskId": "task-uuid"
}
```

#### Stop Task
```http
POST /api/scraper/stop
Content-Type: application/json

{
  "taskId": "task-uuid"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the `.cursorrules` file for code standards
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include error logs and reproduction steps

## 🔧 Troubleshooting

### Socket.IO Connection Issues

If you see Socket.IO connection errors in the console:

1. **Make sure both servers are running:**
   ```bash
   # Check if Socket.IO server is running
   curl http://localhost:3001
   ```

2. **Restart both servers:**
   ```bash
   # Stop all processes and restart
   npm run dev:full
   ```

3. **Check firewall settings:**
   - Ensure port 3001 is not blocked
   - Check if antivirus software is blocking the connection

4. **Clear browser cache:**
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache and cookies

### Real-time Updates Not Working

If real-time updates are not working:

1. **Check browser console for errors**
2. **Verify Socket.IO server is running on port 3001**
3. **Check network connectivity between frontend and Socket.IO server**
4. **Ensure no CORS issues (server should allow localhost:3000)**

### Database Issues

If you encounter database errors:

1. **Check if the database file exists:**
   ```bash
   ls -la data/scraper.db
   ```

2. **Reinitialize the database:**
   ```bash
   # Remove existing database
   rm -f data/scraper.db
   
   # Restart the application
   npm run dev:full
   ```

## 🔄 Changelog

### v1.0.0
- Initial release
- Real-time web scraping dashboard
- Task management system
- Dark mode support
- Comprehensive testing
- SOLID principles implementation
