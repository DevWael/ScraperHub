const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:3001",
		methods: ["GET", "POST"]
	},
	path: '/socket.io/', // Explicit path to avoid conflicts
	transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
	// Client connected
	socket.on('disconnect', () => {
		// Client disconnected
	});

	socket.on('test-client', (data) => {
		// Received test-client event
		socket.emit('test-response', { message: 'Server received your test!' });
	});

	// Test event
	socket.emit('test', { message: 'Hello from Socket.IO server!' });
	
	// Join task room for real-time updates
	socket.on('join-task', (taskId) => {
		socket.join(`task-${taskId}`);
		// Client joined task room
	});
	
	socket.on('leave-task', (taskId) => {
		socket.leave(`task-${taskId}`);
		// Client left task room
	});
	
	// Test event every 5 seconds
	setInterval(() => {
		// Emitting test progress event
		io.emit('task:progress', {
			taskId: 'test-task',
			status: 'running',
			progress: Math.floor(Math.random() * 100),
			message: 'Test progress update',
			timestamp: new Date().toISOString()
		});
	}, 5000);
});

const PORT = 3001;
httpServer.listen(PORT, () => {
	// Socket.IO server running on port
});

// Export for use in other files
module.exports = { io, httpServer };
