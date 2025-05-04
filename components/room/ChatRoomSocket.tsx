'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';

type ChatMessage = {
	user: string;
	text: string;
	timestamp: string;
};

export default function ChatRoomSocket({
	roomId,
	username,
}: {
	roomId: string;
	username: string;
}) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		let active = true;

		const initSocket = async () => {
			await fetch('/api/socket'); // S'assurer que le serveur est prêt

			if (!active) return; // Cas rare où le composant est démonté entre-temps

			const socket = io({ path: '/api/socket_io' });
			socketRef.current = socket;

			socket.emit('join_room', roomId);

			const handleMessage = (msg: ChatMessage) => {
				setMessages((prev) => [...prev, msg]);
			};

			socket.on('receive_message', handleMessage);
			socket.on('connect', () => console.log('🔗 Socket connecté'));
			socket.on('disconnect', () => console.log('❌ Socket déconnecté'));

			// Nettoyage à la fermeture
			const cleanup = () => {
				socket.emit('leave_room', roomId);
				socket.off('receive_message', handleMessage);
				socket.disconnect();
				socketRef.current = null;
			};

			// Cleanup si démonté avant initialisation
			if (!active) cleanup();

			return cleanup;
		};

		initSocket();

		return () => {
			active = false;
			if (socketRef.current) {
				socketRef.current.emit('leave_room', roomId);
				socketRef.current.disconnect();
				socketRef.current = null;
			}
		};
	}, [roomId]);

	const sendMessage = () => {
	if (!newMessage.trim() || !socketRef.current) return;

	const message: ChatMessage = {
		text: newMessage,
		user: username,
		timestamp: new Date().toISOString(),
	};

	// ✅ Emit au serveur
	socketRef.current.emit('send_message', { roomId, message });

	// ✅ Ajout local immédiat
	setMessages((prev) => [...prev, message]);

	// ✅ Reset input
	setNewMessage('');
};


	return (
		<div className="flex flex-col h-full p-4 space-y-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
			<h2 className="text-lg font-bold">Chat</h2>

			<div className="flex-grow overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-900 p-2 rounded">
				{messages.map((msg, i) => (
					<div key={i} className="text-sm">
						<span className="font-semibold">{msg.user}:</span> {msg.text}
					</div>
				))}
			</div>

			<div className="flex gap-2">
				<Input
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
					placeholder="Écrire un message..."
					className="flex-grow"
				/>
				<Button onPress={sendMessage}>Envoyer</Button>
			</div>
		</div>
	);
}
