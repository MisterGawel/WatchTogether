// components/room/useChatSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type ChatMessage = {
	user: string;
	text: string;
	timestamp: string;
};

export function useChatSocket(roomId: string, username: string) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [connected, setConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		if (!roomId || !username) return;

		// Init socket server (Next.js route)
		fetch('/api/socket').then(() => {
			const socket = io({
				path: '/api/socket_io',
			});
			socketRef.current = socket;

			socket.emit('join_room', roomId);
			setConnected(true);

			socket.on('receive_message', (message: ChatMessage) => {
				setMessages((prev) => [...prev, message]);
			});

			// Optionnel : notification quand un utilisateur se connecte/déconnecte
			socket.on('connect', () => console.log('🔗 Connecté au chat'));
			socket.on('disconnect', () => console.log('❌ Déconnecté du chat'));
		});

		return () => {
			if (socketRef.current) {
				socketRef.current.emit('leave_room', roomId);
				socketRef.current.disconnect();
				socketRef.current = null;
			}
			setConnected(false);
		};
	}, [roomId, username]);

	const sendMessage = (text: string) => {
		if (!text.trim() || !socketRef.current) return;
		const message: ChatMessage = {
			user: username,
			text,
			timestamp: new Date().toISOString(),
		};
		socketRef.current.emit('send_message', { roomId, message });
	};

	return {
		messages,
		sendMessage,
		connected,
	};
}
