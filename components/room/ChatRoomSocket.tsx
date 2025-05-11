'use client';
import { FaUserAlt, FaEdit } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
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
  setDoc,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '@/app/firebase';
import { getAuth } from 'firebase/auth';
import { banUser, checkIfUserIsBanned } from '@/components/room/params/userManagement';

type ChatMessage = {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
  userID: string;
};

interface ChatRoomSocketProps {
  roomId: string;
  username: string;
  Role?: 'admin' | 'user';
  darkMode?: boolean;
}

export default function ChatRoomSocket({
  roomId,
  username,
  Role,
  darkMode = false,
}: ChatRoomSocketProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banUserDetails, setBanUserDetails] = useState<{id: string, name: string} | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageText, setEditedMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const messagesRef = collection(db, `chats/${roomId}/messages`);

  const formatDateTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  // Firebase messages listener
  useEffect(() => {
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: ChatMessage[] = snapshot.docs.map((doc) => ({
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

  // Socket.io connection for real-time updates
  useEffect(() => {
    let active = true;

    const initSocket = async () => {
      await fetch('/api/socket');

      if (!active) return;

      const socket = io({ path: '/api/socket_io' });
      socketRef.current = socket;

      socket.emit('join_room', roomId);

      const handleMessage = (msg: any) => {
        setMessages(prev => [...prev, {
          id: msg.id || Date.now().toString(),
          text: msg.text,
          user: msg.user,
          userID: msg.userID || '',
          timestamp: new Date(msg.timestamp || Date.now())
        }]);
      };

      socket.on('receive_message', handleMessage);
      socket.on('connect', () => console.log('🔗 Socket connecté'));
      socket.on('disconnect', () => console.log('❌ Socket déconnecté'));

      const cleanup = () => {
        socket.emit('leave_room', roomId);
        socket.off('receive_message', handleMessage);
        socket.disconnect();
        socketRef.current = null;
      };

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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("Vous devez être connecté pour envoyer un message");
        return;
      }

      const userID = user.uid;
      const requiresAuth = !!communityId;

      // Send to Firebase
      const newDoc = await addDoc(messagesRef, {
        text: newMessage,
        user: username,
        userID: userID,
        timestamp: serverTimestamp(),
        requiresAuth: requiresAuth
      });

      // Also send via Socket.io
      if (socketRef.current) {
        socketRef.current.emit('send_message', { 
          roomId, 
          message: {
            id: newDoc.id,
            text: newMessage,
            user: username,
            userID: userID,
            timestamp: new Date().toISOString()
          }
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (Role === 'admin' || messages.find(msg => msg.id === id)?.user === username) {
      try {
        await deleteDoc(doc(db, `chats/${roomId}/messages/${id}`));
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditedMessageText(currentText);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageText('');
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editedMessageText.trim()) return;

    try {
      const messageRef = doc(db, `chats/${roomId}/messages/${editingMessageId}`);
      await updateDoc(messageRef, {
        text: editedMessageText,
        editedAt: serverTimestamp()
      });

      // Mise à jour via Socket.io si nécessaire
      if (socketRef.current) {
        socketRef.current.emit('edit_message', {
          roomId,
          messageId: editingMessageId,
          newText: editedMessageText
        });
      }

      setEditingMessageId(null);
      setEditedMessageText('');
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Une erreur est survenue lors de la modification du message");
    }
  };

  const handleBanClick = async (userId: string, userName: string) => {
    try {
      const isBanned = await checkIfUserIsBanned(roomId, userId);
      if (isBanned) {
        alert("Cet utilisateur est déjà banni");
        return;
      }

      setBanUserDetails({
        id: userId,
        name: userName
      });
      setShowBanModal(true);
    } catch (error) {
      console.error("Error checking ban status:", error);
      alert("Erreur lors de la vérification du statut de bannissement");
    }
  };

  const cancelBan = () => {
    setShowBanModal(false);
    setBanUserDetails(null);
  };

  const MAX_LENGTH = 50;
  const toggleExpandMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  if (loading) {
    return <div className={`p-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chargement des messages...</div>;
  }

  return (
    <div className={`flex flex-col h-full gap-4 ${darkMode ? 'dark' : ''}`}>
      <div className={`flex flex-col flex-grow p-4 space-y-4 overflow-y-auto rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {messages.map((msg, index) => {
          const currentDate = formatDate(msg.timestamp);
          const prevDate = index > 0 ? formatDate(messages[index - 1].timestamp) : null;
          const showDateSeparator = prevDate !== currentDate;

          const isExpanded = expandedMessage === msg.id;
          const displayText =
            msg.text.length > MAX_LENGTH && !isExpanded
              ? msg.text.slice(0, MAX_LENGTH) + '...'
              : msg.text;
          const isCurrentUserMessage = msg.user === username;
          
          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div key={`date-${msg.id}`} className="flex items-center my-4">
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                  <span className={`px-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentDate}
                  </span>
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                </div>
              )}
              
              <div className="flex flex-row">
                {/* Icône utilisateur */}
                <div className={`flex items-start pt-1 flex-shrink-0 w-8 h-8 mr-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <FaUserAlt className={`m-auto text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>

                {/* Contenu du message */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      isCurrentUserMessage 
                        ? darkMode ? 'text-gray-100' : 'text-gray-800'
                        : darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {msg.user}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDateTime(msg.timestamp)}
                    </span>
                  </div>

                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        value={editedMessageText}
                        onChange={(e) => setEditedMessageText(e.target.value)}
                        className={`${darkMode ? 'bg-white-700 text-white' : 'bg-white text-gray-900'}`}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onPress={saveEditedMessage}
                          size="sm"
                          className={darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}
                        >
                          Enregistrer
                        </Button>
                        <Button 
                          onPress={cancelEdit}
                          size="sm"
                          className={darkMode ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`px-3 py-2 rounded-lg relative ${
                      isCurrentUserMessage
                        ? darkMode ? 'bg-gray-600' : 'bg-gray-100'
                        : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <p className={darkMode ? 'text-gray-100' : 'text-gray-800'}>
                        {displayText}
                      </p>

                      <div className="absolute top-1 right-1 flex gap-1">
                        {isCurrentUserMessage && (
                          <button
                            onClick={() => handleEditMessage(msg.id, msg.text)}
                            className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'}`}
                            aria-label="Modifier le message"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        )}
                        {(Role === 'admin' || isCurrentUserMessage) && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className={`${darkMode ? 'text-gray-300 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`}
                            aria-label="Supprimer le message"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.text.length > MAX_LENGTH && !editingMessageId && (
                    <button
                      onClick={() => toggleExpandMessage(msg.id)}
                      className={`mt-1 text-xs underline self-start ${
                        darkMode ? 'text-blue-300' : 'text-blue-500'
                      }`}
                    >
                      {isExpanded ? 'Voir moins' : 'Voir plus'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Écrivez un message"
          className={`flex-grow ${darkMode ? 'bg-white-700 text-white placeholder-gray-400 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
        />
        <Button 
          onPress={sendMessage} 
          className={darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}
        >
          Envoyer
        </Button>
      </div>
    </div>
  );
}