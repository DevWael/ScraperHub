// Use CommonJS for compatibility with API routes
const { Server } = require('socket.io');

// Global Socket.IO server instance
let io = undefined;

function initializeSocketServer() {
	if (io) {
		return io;
	}

	try {
		// Try to get the standalone server
		const { io: standaloneIo } = require('../socket-server.js');
		if (standaloneIo) {
			io = standaloneIo;
			return io;
		} else {
			// Standalone Socket.IO server not available
			return undefined;
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		// Socket.IO server not running or not accessible
		return undefined;
	}
}

function getSocketServer() {
	return io;
}

function emitToAll(event: string, data: any) {
	if (!io) {
		// Try to initialize if not already done
		initializeSocketServer();
	}
	
	if (io) {
		try {
			io.emit(event, data);
		} catch (error) {
			// Failed to emit event
		}
	} else {
		// Socket.IO server not available, cannot emit
	}
}

function emitToRoom(room: string, event: string, data: any) {
	if (io) {
		io.to(room).emit(event, data);
	}
}

// Export using ES6 modules
export {
	initializeSocketServer,
	getSocketServer,
	emitToAll,
	emitToRoom
};
