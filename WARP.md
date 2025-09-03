# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Web Scraper Dashboard**, a modern Next.js application that provides a real-time web scraping interface built with TypeScript, React, and Socket.IO. The project consists of two main components:

1. **Web Scraper Dashboard** (webapp/) - Next.js 14 frontend with real-time task management
2. **Enhanced Web Scraper** (parent directory) - Node.js command-line crawler tool

## Core Commands

### Development
```bash
# Start both Next.js and Socket.IO servers (integrated)
npm run dev

# Note: start-dev.sh script and separate socket server do not exist
# The Socket.IO server is integrated with the Next.js server on port 3000
```

### Building & Production
```bash
npm run build        # Build Next.js application
npm start           # Start production server
npm run lint        # Run ESLint
```

### Testing
```bash
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
npx jest --coverage # Run tests with coverage
```

### Database
Database is automatically initialized on startup (SQLite with better-sqlite3). No separate migration commands needed.

## High-Level Architecture

### Component Structure
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Real-time Communication**: Integrated Socket.IO server (port 3000)
- **Database**: SQLite with better-sqlite3 for task persistence
- **Task Processing**: Child processes spawning Node.js crawler instances
- **API Layer**: Next.js API routes handling CRUD operations

### Key Architectural Patterns

#### 1. Real-time Task Management System
```
Browser (React) ←→ Socket.IO Client ←→ Socket.IO Server ←→ API Routes ←→ Database
                                            ↓
                                    Child Process (Crawler)
```

- **Socket.IO Server**: Integrated server handles real-time events on the same port as Next.js
- **API Routes**: RESTful endpoints in `app/api/` manage task lifecycle
- **Task Processing**: Child processes execute the crawler with live progress updates
- **Database**: SQLite stores tasks, runs, and scraped pages with foreign key relationships

#### 2. Database Schema Design
```
tasks (main task records)
  ↓ (1:many)
task_runs (execution history)
  ↓ (1:many)
scraped_pages (individual page results)
```

#### 3. Component Architecture
- **Page Components**: `app/page.tsx` main dashboard, `app/tasks/[id]/page.tsx` task details
- **Modal System**: Separate modals for task creation, settings, details, and history
- **Real-time Updates**: React state synced with Socket.IO events for live progress
- **Utility Functions**: Centralized in `lib/utils.ts` with comprehensive testing

### Development Standards

Based on `.cursor/rules/general.mdc` and codebase analysis:

#### Code Style
- **Indentation**: Tabs (not spaces) for line beginnings
- **Comments**: English only, end with periods
- **Testing**: Jest with comprehensive unit tests required
- **OOP Focus**: Emphasize object-oriented programming for modularity
- **DRY Principle**: Focus on reusability, avoid duplication
- **Naming**: Descriptive functions, variables, and file names

#### Architecture Principles
- **SOLID Principles**: Single responsibility, dependency injection patterns
- **Error Boundaries**: Comprehensive error handling throughout
- **Type Safety**: Strict TypeScript, no `any` types
- **Performance**: Optimized rendering and state management

### File Organization Patterns
```
app/                    # Next.js App Router
├── api/               # API routes (RESTful endpoints)
│   ├── scraper/       # Task management endpoints
│   └── tasks/         # CRUD operations
├── tasks/[id]/        # Dynamic task detail pages
├── globals.css        # Global Tailwind styles
├── layout.tsx         # Root layout with providers
└── page.tsx           # Main dashboard

components/            # React components (one per file)
├── TaskCard.tsx       # Individual task display
├── *Modal.tsx         # Modal components for different views
└── StatisticsPanel.tsx # Analytics dashboard

lib/                   # Server-side utilities and business logic
├── database.ts        # SQLite operations with prepared statements
├── socket-server.ts   # Socket.IO server management
├── utils.ts           # Pure utility functions
└── crawler-server.ts  # Server-side crawler integration

types/                 # TypeScript definitions
└── task.ts           # Task interfaces and types
```

### Key Integrations

#### Socket.IO Integration
- **Integrated Server**: Runs on port 3000 integrated with Next.js
- **Event System**: Real-time task updates (`task:started`, `task:progress`, `task:completed`, `task:failed`)
- **Connection Management**: Auto-reconnection with exponential backoff
- **Server Integration**: API routes emit Socket.IO events for live updates

#### Database Integration
- **Better-SQLite3**: Synchronous SQLite operations with prepared statements
- **Auto-initialization**: Tables created automatically on first run
- **Prepared Statements**: Pre-compiled queries in `lib/database.ts` for performance
- **Foreign Key Support**: Relational data integrity between tasks, runs, and pages

#### Child Process Management
- **Crawler Execution**: Tasks spawn Node.js child processes running the crawler
- **Progress Parsing**: Real-time stdout parsing for progress updates
- **Error Handling**: Stderr monitoring and graceful failure handling
- **Process Cleanup**: Automatic cleanup on task completion or failure

### Environment Setup

#### Required Dependencies
- Node.js 18+
- SQLite (bundled with better-sqlite3)
- Next.js 14+ with React 18

#### Configuration Files
- `next.config.js`: Webpack configuration with server/client bundle separation
- `tailwind.config.js`: UI styling configuration
- `jest.config.js`: Testing framework setup with Next.js integration
- `tsconfig.json`: TypeScript compiler options

### Common Development Tasks

#### Adding New API Endpoints
1. Create route file in `app/api/[endpoint]/route.ts`
2. Follow RESTful conventions (GET, POST, PUT, DELETE)
3. Use database prepared statements from `lib/database.ts`
4. Emit Socket.IO events for real-time updates when applicable
5. Add TypeScript interfaces in `types/task.ts`

#### Adding New Components
1. Create component file in `components/` with PascalCase naming
2. Use TypeScript with proper interfaces
3. Implement error boundaries for fault tolerance
4. Add unit tests if component contains business logic
5. Follow existing patterns for modals and task management

#### Working with Real-time Features
1. Socket.IO events must be handled in both client and server
2. API routes should emit events using `emitToAll()` from `lib/socket-server.ts`
3. React components subscribe to Socket.IO events in `useEffect`
4. Always handle connection errors and reconnection scenarios

#### Database Operations
1. Use prepared statements from `lib/database.ts` exports
2. Handle SQLite constraints and foreign key relationships
3. Wrap operations in try-catch for error handling
4. Consider transaction boundaries for multi-table operations

### Testing Strategy
- **Unit Tests**: All utility functions in `lib/utils.ts` have comprehensive Jest tests
- **Component Tests**: React components tested for behavior, not implementation
- **Integration Tests**: API endpoints tested end-to-end
- **Coverage**: Run `npx jest --coverage` to ensure adequate test coverage

### Error Handling Patterns
- **API Routes**: Consistent error response format with appropriate HTTP status codes
- **React Components**: Error boundaries prevent cascading failures
- **Database Operations**: Prepared statement errors handled with rollback capability
- **Socket.IO**: Connection error handling with reconnection logic
- **Child Processes**: Graceful handling of crawler failures and cleanup

### Performance Considerations
- **Database**: Prepared statements and indexes for query optimization
- **React**: Memoization for expensive computations and renders
- **Socket.IO**: Event throttling to prevent UI flooding
- **Next.js**: Optimized bundle splitting between server/client code
- **Concurrent Tasks**: Multiple scraping tasks can run simultaneously without conflicts
