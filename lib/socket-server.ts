// Socket.IO server utilities for the unified server
let io: any = undefined;

function initializeSocketServer() {
	// In the unified server approach, io is available globally
	if ((global as any).io) {
		io = (global as any).io;
		return io;
	}
	return undefined;
}

function getSocketServer() {
	if (!io) {
		initializeSocketServer();
	}
	return io;
}

function emitToAll(event: string, data: any) {
	const socketIO = getSocketServer();
	if (socketIO) {
		try {
			socketIO.emit(event, data);
		} catch (error) {
			console.error('Failed to emit event:', error);
		}
	} else {
		console.warn('Socket.IO server not available, cannot emit event:', event);
	}
}

function emitToRoom(room: string, event: string, data: any) {
	const socketIO = getSocketServer();
	if (socketIO) {
		try {
			socketIO.to(room).emit(event, data);
		} catch (error) {
			console.error('Failed to emit to room:', error);
		}
	} else {
		console.warn('Socket.IO server not available, cannot emit to room:', room);
	}
}

// Export using ES6 modules
export {
	initializeSocketServer,
	getSocketServer,
	emitToAll,
	emitToRoom
};
