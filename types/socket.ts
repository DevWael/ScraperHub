import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
	socket: Socket & {
		server: NetServer & {
			io: SocketIOServer;
		};
	};
};

export interface SocketEventData {
	taskId: string;
	status?: string;
	progress?: number;
	pagesScraped?: number;
	pagesFailed?: number;
	imagesDownloaded?: number;
	currentUrl?: string;
	totalUrls?: number;
	error?: string;
	message?: string;
	timestamp?: string;
}
