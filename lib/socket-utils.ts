import { getSocketServer } from './socket-server';

// Utility functions for emitting Socket.IO events
export const socketUtils = {
	// Emit to all connected clients
	emitToAll: (event: string, data: any) => {
		const io = getSocketServer();
		if (io) {
			io.emit(event, data);
		}
	},

	// Emit to a specific room (e.g., task-specific updates)
	emitToRoom: (room: string, event: string, data: any) => {
		const io = getSocketServer();
		if (io) {
			io.to(room).emit(event, data);
		}
	},

	// Emit task progress updates
	emitTaskProgress: (taskId: string, data: {
		status?: string;
		progress?: number;
		pagesScraped?: number;
		pagesFailed?: number;
		imagesDownloaded?: number;
		currentUrl?: string;
		totalUrls?: number;
		message?: string;
	}) => {
		const io = getSocketServer();
		if (io) {
			io.to(`task-${taskId}`).emit('task:progress', {
				taskId,
				timestamp: new Date().toISOString(),
				...data
			});
		}
	},

	// Emit task completion
	emitTaskCompleted: (taskId: string, data: {
		pagesScraped?: number;
		pagesFailed?: number;
		imagesDownloaded?: number;
		totalUrls?: number;
	}) => {
		const io = getSocketServer();
		if (io) {
			io.to(`task-${taskId}`).emit('task:completed', {
				taskId,
				timestamp: new Date().toISOString(),
				...data
			});
		}
	},

	// Emit task failure
	emitTaskFailed: (taskId: string, error: string) => {
		const io = getSocketServer();
		if (io) {
			io.to(`task-${taskId}`).emit('task:failed', {
				taskId,
				error,
				timestamp: new Date().toISOString()
			});
		}
	},

	// Emit task started
	emitTaskStarted: (taskId: string) => {
		const io = getSocketServer();
		if (io) {
			io.emit('task:started', {
				taskId,
				timestamp: new Date().toISOString()
			});
		}
	}
};
