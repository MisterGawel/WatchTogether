'use client';
import { useState, useEffect } from 'react';
import {
	getDoc,
	collection,
	addDoc,
	query,
	orderBy,
	onSnapshot,
	deleteDoc,
	doc,
} from 'firebase/firestore';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db,auth } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
export default function ChatCommu({ Role, roomId }) {
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState('');
	const [expandedMessage, setExpandedMessage] = useState(null);
	const User1 = 'Alexis'; // Remplace par l'utilisateur actuel
	const [userName, setUserName] = useState(''); // Nouvel état pour le nom de l'utilisateur
	const messagesRef = collection(db, `chats/${roomId}/messages`);

	useEffect(() => {
		const q = query(messagesRef, orderBy('timestamp', 'asc'));
		const unsubscribe = onSnapshot(q, (snapshot) => {
			const loadedMessages = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setMessages(loadedMessages);
		});

		return () => unsubscribe(); // Nettoie l'écouteur quand le composant est démonté
	}, [roomId]);

	
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
		  if (currentUser) {
			// Récupère le document utilisateur dans Firestore en utilisant l'UID
			const docRef = doc(db, 'users', currentUser.uid);
			const docSnap = await getDoc(docRef);
	
			if (docSnap.exists()) {
			  const data = docSnap.data();
			  setUserName(data.name);
			} else {
			  console.log("Aucun utilisateur trouvé pour cet UID.");
			}
		  } else {
			setUserName('');
		  }
		});
	
		// Nettoyage de l'écouteur d'état d'authentification lors du démontage du composant
		return () => unsubscribe();
	  }, []);


	const sendMessage = async () => {
		if (newMessage.trim() !== '') {
			await addDoc(messagesRef, {
				text: newMessage,
				user: userName,
				timestamp: Date.now(),
			});
			setNewMessage(''); // Réinitialiser le champ après l'envoi
		}
	};

	const deleteMessage = async (id) => {
		if (Role === 'admin') {
			await deleteDoc(doc(db, `chats/${roomId}/messages`, id));
		}
	};

	const MAX_LENGTH = 50;
	const toggleExpandMessage = (id) => {
		setExpandedMessage(expandedMessage === id ? null : id);
	};

	return (
		<div className="">
			<h1 className="p-4 text-xl font-bold text-center shadow-md bg-grey-100">
				Espace de Chat
			</h1>
			<div className="flex-grow p-4 space-y-2 overflow-y-auto bg-white">
				{messages.map((msg) => {
					const isMessageExpanded = expandedMessage === msg.id;
					const truncatedText =
						msg.text.length > MAX_LENGTH && !isMessageExpanded
							? msg.text.slice(0, MAX_LENGTH) + '...'
							: msg.text;

					return (
						<Card key={msg.id} className="relative p-2">
							<p className="font-semibold">{msg.user}</p>
							{Role === 'admin' && (
								<Button
									isIconOnly
									size="sm"
									variant="light"
									color="danger"
									onPress={() => deleteMessage(msg.id)}
									className="absolute text-lg leading-none top-1 right-1"
								>
									×
								</Button>
							)}
							<p>{truncatedText}</p>
							{msg.text.length > MAX_LENGTH && (
								<Button
									onPress={() => toggleExpandMessage(msg.id)}
									className="inline-flex items-center w-1 p-0 ml-2 text-sm text-blue-500 underline"
								>
									{isMessageExpanded
										? 'Voir moins'
										: 'Voir plus'}
								</Button>
							)}
						</Card>
					);
				})}
			</div>
			<div className="flex p-4 space-x-2 bg-white">
				<Input
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					placeholder="Écrivez un message..."
					className="flex-grow"
				/>
				<Button
					onPress={sendMessage}
					className="flex items-center gap-2"
				>
					Envoyer
				</Button>
			</div>
		</div>
	);
}
