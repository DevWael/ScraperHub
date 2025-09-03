# Socket.IO Migration Guide

## Overview
We've successfully merged the separate Socket.IO server (port 3001) into the main Next.js application (port 3000) to simplify the architecture.

## What Changed

### Before (Dual Port Architecture)
- **Port 3000**: Next.js web application
- **Port 3001**: Standalone Socket.IO server
- Required running two separate processes
- More complex deployment and development setup

### After (Unified Architecture)
- **Port 3000**: Next.js app + Socket.IO server integrated
- Single process, single port
- Simplified development and deployment
- Better resource utilization

## New File Structure

```
├── server.js                    # New unified server (Next.js + Socket.IO)
├── lib/
│   ├── socket-server.ts         # Updated to work with unified server
│   └── socket-utils.ts          # New utility functions for emitting events
├── types/
│   └── socket.ts                # TypeScript types for Socket.IO
└── app/api/socket/route.ts      # Socket.IO endpoint (for compatibility)
```

## How to Use

### Starting the Server
```bash
# Development
npm run dev

# Production
npm run start
```

### Emitting Events from API Routes
```typescript
import { socketUtils } from '@/lib/socket-utils';

// Emit task progress
socketUtils.emitTaskProgress(taskId, {
  status: 'running',
  progress: 50,
  pagesScraped: 25
});

// Emit task completion
socketUtils.emitTaskCompleted(taskId, {
  pagesScraped: 100,
  imagesDownloaded: 50
});

// Emit task failure
socketUtils.emitTaskFailed(taskId, 'Network error occurred');
```

### Frontend Connection
The frontend now connects to the unified server:
```typescript
const socket = io('http://localhost:3000', {
  path: '/api/socket'
});
```

## Benefits

1. **Simplified Development**: Only one server to start and manage
2. **Better Performance**: No cross-origin communication overhead
3. **Easier Deployment**: Single process to deploy and monitor
4. **Resource Efficiency**: Shared HTTP server and port
5. **Maintainability**: Centralized Socket.IO logic

## Migration Notes

- Removed `socket-server.js` (standalone server)
- Updated `package.json` scripts to use unified server
- Frontend now connects to port 3000 instead of 3001
- All existing Socket.IO functionality preserved
- Better TypeScript support with proper types

## Troubleshooting

If you encounter issues:

1. **Port conflicts**: Ensure port 3000 is available
2. **Socket connection errors**: Check that the server is running with `npm run dev`
3. **Event emission issues**: Verify the socket utilities are properly imported

The unified architecture maintains all existing functionality while providing a cleaner, more maintainable codebase.
