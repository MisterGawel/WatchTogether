'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db } from '@/firebase';

type Message = {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
};

interface ChatRoomProps {
  roomId: string;
  currentUser?: string;
  initialMessages?: Message[];
  Role?: 'admin' | 'user';
}

export default function ChatRoom({
  roomId,
  currentUser = '2',
  initialMessages = [],
  Role
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<string | null>(null);

  const messagesRef = collection(db, `chats/${roomId}/messages`);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const roomDocRef = doc(db, `rooms/${roomId}`);
        const roomSnap = await getDoc(roomDocRef);
        if (roomSnap.exists()) {
          const data = roomSnap.data();
          setAdmin(data.admin);
        }
      } catch (error) {
        console.error("Erreur récupération admin:", error);
      }
    };

    fetchAdmin();
  }, [roomId]);

  // Récupération en temps réel des messages
  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        user: doc.data().user,
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
      setMessages(fetchedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addDoc(messagesRef, {
        text: newMessage,
        user: currentUser,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erreur d'envoi:", error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (admin === currentUser) {
      await deleteDoc(doc(db, `chats/${roomId}/messages/${id}`));
    }
  };


  const MAX_LENGTH = 50;
  const toggleExpandMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  if (loading) return <div className="p-4 text-center">Chargement des messages...</div>;

  return (
    <div className="h-full flex flex-col">
      <h1 className="p-4 text-xl font-bold text-center shadow-md bg-grey-100">
        Espace de Chat
      </h1>

      {/* Messages listés du plus ancien au plus récent */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-white">
        {messages.map((msg) => {
          const isExpanded = expandedMessage === msg.id;
          const displayText =
            msg.text.length > MAX_LENGTH && !isExpanded
              ? msg.text.slice(0, MAX_LENGTH) + '...'
              : msg.text;

          return (
            <Card key={msg.id} className="p-2 relative">
              <p className="font-semibold">{msg.user}</p>
              {admin === currentUser && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => handleDeleteMessage(msg.id)}
                  className="absolute top-1 right-1"
                >
                  ×
                </Button>
              )}
              <p>{displayText}</p>
              {msg.text.length > MAX_LENGTH && (
                <Button
                  onPress={() => toggleExpandMessage(msg.id)}
                  className="text-blue-500 text-sm underline p-0 ml-2"
                >
                  {isExpanded ? 'Voir moins' : 'Voir plus'}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Input pour envoyer un message */}
      <div className="p-4 bg-white flex space-x-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-grow"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button onPress={sendMessage} className="flex items-center gap-2">
          Envoyer
        </Button>
      </div>
    </div>
  );
}
