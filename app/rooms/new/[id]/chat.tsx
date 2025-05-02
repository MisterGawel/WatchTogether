'use client';
import { useState, useEffect, useRef } from 'react';
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
  setDoc
} from 'firebase/firestore';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db } from '@/app/firebase';
import { getAuth } from 'firebase/auth';

type Message = {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
  userID: string;
};

interface ChatRoomProps {
  roomId: string;
  currentUser: string;
  initialMessages?: Message[];
  Role?: 'admin' | 'user';
  darkMode?: boolean;
}

export default function ChatRoom({
  roomId,
  currentUser,
  initialMessages = [],
  Role,
  darkMode = false,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messagesRef = collection(db, `chats/${roomId}/messages`);

  const formatDateTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomDocRef = doc(db, `rooms/${roomId}`);
        const roomSnap = await getDoc(roomDocRef);
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          setAdmin(roomData.admin);
          setCommunityId(roomData.community || null);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    fetchRoomData();
  }, [roomId]);

  useEffect(() => {
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        user: doc.data().user,
        userID: doc.data().userID || '',
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
      setMessages(fetchedMessages);
      setLoading(false);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      let userID = '';
      let requiresAuth = false;

      if (communityId) {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          alert("Vous devez être connecté pour envoyer un message dans cette room communautaire");
          return;
        }

        userID = user.uid;
        requiresAuth = true;
      } else {
        userID = 'guest_' + currentUser;
      }

      await addDoc(messagesRef, {
        text: newMessage,
        user: currentUser,
        userID: userID,
        timestamp: serverTimestamp(),
        requiresAuth: requiresAuth
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (Role === 'admin' || messages.find(msg => msg.id === id)?.user === currentUser) {
      try {
        await deleteDoc(doc(db, `chats/${roomId}/messages/${id}`));
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const handleBanClick = (userId: string) => {
    setUserToBan(userId);
    setShowBanModal(true);
  };

  const confirmBan = async () => {
    if (!userToBan || !roomId) return;
    
    try {
      const banRef = doc(db, `rooms/${roomId}/excluded`, userToBan);
      await setDoc(banRef, {
        userId: userToBan,
        userName: messages.find(msg => msg.userID === userToBan)?.user || 'Unknown',
        timestamp: serverTimestamp(),
        bannedBy: currentUser,
        bannedAt: new Date().toISOString()
      });
      
      const userMessages = messages.filter(msg => msg.userID === userToBan);
      for (const msg of userMessages) {
        await deleteDoc(doc(db, `chats/${roomId}/messages/${msg.id}`));
      }
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      setShowBanModal(false);
      setUserToBan(null);
    }
  };

  const cancelBan = () => {
    setShowBanModal(false);
    setUserToBan(null);
  };

  const MAX_LENGTH = 50;
  const toggleExpandMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  if (loading) {
    return <div className={`p-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chargement des messages...</div>;
  }

  return (
    <div className="flex flex-col h-full relative">
      <h1 className={`p-4 text-xl font-bold text-center shadow-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        Espace de Chat
      </h1>

      <div className="flex flex-col flex-grow">
        <div 
          ref={chatContainerRef}
          className={`flex-grow p-4 space-y-2 overflow-y-auto ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
          style={{ maxHeight: '400px' }}
        >
          {messages.map((msg) => {
            const isExpanded = expandedMessage === msg.id;
            const displayText =
              msg.text.length > MAX_LENGTH && !isExpanded
                ? msg.text.slice(0, MAX_LENGTH) + '...'
                : msg.text;
            const isCurrentUserMessage = msg.user === currentUser;
            
            const cardClasses = [
              'relative p-2 rounded-lg',
              darkMode 
                ? isCurrentUserMessage 
                  ? 'bg-gray-500'
                  : 'bg-gray-600'
                : isCurrentUserMessage
                  ? 'bg-gray-100'
                  : 'bg-gray-50'
            ].join(' ');
            
            return (
              <Card key={msg.id} className={cardClasses}>
                <div className="flex justify-between items-start">
                  <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {msg.user}
                  </p>
                  {(Role === 'admin' || isCurrentUserMessage) && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteMessage(msg.id)}
                      aria-label="Supprimer le message"
                      className="absolute top-1 right-1"
                    >
                      ×
                    </Button>
                  )}
                </div>
                
                <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                  {displayText}
                </p>

                <div className="flex justify-between items-center mt-2">
                  {msg.text.length > MAX_LENGTH && (
                    <Button
                      onPress={() => toggleExpandMessage(msg.id)}
                      className={`p-0 text-sm underline ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}
                    >
                      {isExpanded ? 'Voir moins' : 'Voir plus'}
                    </Button>
                  )}
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-auto`}>
                    {formatDateTime(msg.timestamp)}
                  </p>
                </div>

                {Role === 'admin' && msg.userID !== admin && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="warning"
                    onPress={() => handleBanClick(msg.userID)}
                    aria-label="Bannir l'utilisateur"
                    className="absolute top-1 right-8"
                  >
                    🚫
                  </Button>
                )}
              </Card>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className={`flex p-4 space-x-2 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={communityId ? "Écrivez un message " : "Écrivez un message"}
            className={`flex-grow ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900'}`}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button
            onPress={sendMessage}
            className="flex items-center gap-2"
          >
            Envoyer
          </Button>
        </div>
      </div>

      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-md w-full`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Confirmer le bannissement
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Êtes-vous sûr de vouloir bannir cet utilisateur ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onPress={cancelBan}
                variant="light"
                className={darkMode ? 'text-gray-100' : 'text-gray-800'}
              >
                Annuler
              </Button>
              <Button
                onPress={confirmBan}
                color="danger"
              >
                Bannir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}