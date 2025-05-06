'use client';
import { FaUserAlt } from 'react-icons/fa';
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
		<div className="flex flex-col h-full gap-4">
			<div className="flex flex-col flex-grow p-4 space-y-4 overflow-y-auto rounded-lg bg-background">
				{messages.map((msg, i) => (
					<div key={i} className="flex flex-row text-md">
						{/* ICONE */}
						<div className="flex items-center justify-center flex-shrink-0 w-10 h-10 mr-4 rounded-xl bg-foreground-50">
							<FaUserAlt className="text-xl text-foreground" />
						</div>

						{/* MESSAGE */}
						<div className="flex flex-col flex-1 break-all ">
							<div className="flex items-center gap-2 mb-1">
								<span className="font-semibold">
									{msg.user}
								</span>
								<span className="text-sm text-gray-500">
									{new Date(
										msg.timestamp
									).toLocaleTimeString()}
								</span>
							</div>
							{msg.text}
						</div>
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
				<Button onPress={sendMessage} color="primary">
					Envoyer
				</Button>
			</div>
		</div>
	);
}
