// pages/api/socket.ts
import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponseServerIO } from '@/types/next';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
	if (!res.socket.server.io) {
		console.log('🔌 Initialisation de Socket.IO...');

		const io = new Server(res.socket.server, {
			path: '/api/socket_io',
			addTrailingSlash: false,
		});

		res.socket.server.io = io;

		io.on('connection', (socket) => {
			console.log(`🟢 Client connecté : ${socket.id}`);

			socket.on('join_room', (roomId) => {
				socket.join(roomId);
				console.log(`👤 ${socket.id} a rejoint ${roomId}`);
			});

			socket.on('leave_room', (roomId) => {
				socket.leave(roomId);
				console.log(`👤 ${socket.id} a quitté ${roomId}`);
			});

			socket.on('send_message', ({ roomId, message }) => {
				console.log(`💬 ${message.user}: ${message.text}`);
				socket.to(roomId).emit('receive_message', message);
			});
		});
	}

	res.end();
}
