const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	// Create HTTP server
	const server = createServer(async (req, res) => {
		try {
			// Parse the URL
			const parsedUrl = parse(req.url, true);
			
			// Let Next.js handle the request
			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error('Error occurred handling request:', err);
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	});

	// Create Socket.IO server attached to the same HTTP server
	const io = new Server(server, {
		cors: {
			origin: dev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_APP_URL,
			methods: ["GET", "POST"]
		},
		path: '/api/socket',
		transports: ['websocket', 'polling']
	});

	// Socket.IO connection handling
	io.on('connection', (socket) => {
		// Client connected
		console.log('Client connected:', socket.id);

		socket.on('disconnect', () => {
			// Client disconnected
			console.log('Client disconnected:', socket.id);
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
			console.log(`Client joined task room: task-${taskId}`);
		});
		
		socket.on('leave-task', (taskId) => {
			socket.leave(`task-${taskId}`);
			console.log(`Client left task room: task-${taskId}`);
		});
	});

	// Test event every 5 seconds (for development)
	if (dev) {
		setInterval(() => {
			io.emit('task:progress', {
				taskId: 'test-task',
				status: 'running',
				progress: Math.floor(Math.random() * 100),
				message: 'Test progress update',
				timestamp: new Date().toISOString()
			});
		}, 5000);
	}

	// Start the server
	server.listen(port, (err) => {
		if (err) throw err;
		console.log(`> Ready on http://${hostname}:${port}`);
		console.log(`> Socket.IO server running on port ${port}`);
	});

	// Export io for use in other parts of the app
	global.io = io;
});
