import { NextRequest } from 'next/server';

// This route is not used for HTTP requests, only for Socket.IO compatibility
// The actual Socket.IO server is now running in server.js on port 3000
export async function GET() {
	return new Response('Socket.IO endpoint - use WebSocket connection instead', {
		status: 200,
	});
}
