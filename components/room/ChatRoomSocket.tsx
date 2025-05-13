'use client';
import { FaUserAlt, FaEdit, FaEllipsisV, FaReply } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import { getAuth } from 'firebase/auth';
import {
  formatDateTime,
  formatDate,
  scrollToMessage,
  truncateText,
  shouldShowDateSeparator
} from '@/components/room/chat/messageUtils';
import {
  handleSendMessage,
  handleEditMessage,
  saveEditedMessage,
  handleReply,
} from '@/components/room/chat/messageHandlers';
import { ChatMessage, ChatRoomSocketProps, MessageHandlersProps, MessageReply } from '@/components/room/chat/messageTypes';

export default function ChatRoomSocket({
  roomId,
  username,
  Role,
  darkMode = false,
  children,
  onMessageSend,
  onMessageDelete,
  customStyles
}: ChatRoomSocketProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageText, setEditedMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageReply | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const messagesRef = collection(db, `chats/${roomId}/messages`);
  const MAX_LENGTH = 100;

  const auth = getAuth();
  const currentUser = {
    uid: auth.currentUser?.uid || `ephemeral-${username}`,
    displayName: auth.currentUser?.displayName || username,
    isGuest: !auth.currentUser?.uid
  };

  const handlersProps: MessageHandlersProps = {
    roomId,
    username,
    Role,
    communityId,
    messagesRef,
    socketRef,
    messages,
    setMessages,
    currentUser
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
      const fetchedMessages: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const message: ChatMessage = {
          id: doc.id,
          text: data.text,
          user: data.user,
          userID: data.userID || '',
          timestamp: data.timestamp?.toDate() || new Date(),
          editedAt: data.editedAt?.toDate(),
          isEdited: !!data.editedAt,
          replyTo: data.replyTo || undefined,
          status: data.status || 'delivered',
          reactions: data.reactions || {}
        };

        if (data.attachments) {
          message.attachments = data.attachments.map((att: any) => ({
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.url,
            thumbnailUrl: att.thumbnailUrl
          }));
        }

        return message;
      });
      setMessages(fetchedMessages);
      setLoading(false);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    let active = true;

    const initSocket = async () => {
      await fetch('/api/socket');

      if (!active) return;

      const socket = io({ path: '/api/socket_io' });
      socketRef.current = socket;

      socket.emit('join_room', roomId);

      const handleMessage = (msg: any) => {
        const newMessage: ChatMessage = {
          id: msg.id || Date.now().toString(),
          text: msg.text,
          user: msg.user,
          userID: msg.userID || '',
          timestamp: new Date(msg.timestamp || Date.now()),
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
          isEdited: msg.isEdited || false,
          replyTo: msg.replyTo || undefined,
          status: 'delivered'
        };

        setMessages(prev => [...prev, newMessage]);
        if (onMessageSend) onMessageSend(newMessage);
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
  }, [roomId, onMessageSend]);

  const sendMessage = async () => {
    try {
      const message = await handleSendMessage(
        newMessage,
        replyingTo,
        handlersProps,
        setNewMessage,
        setReplyingTo
      );
      if (message && onMessageSend) onMessageSend(message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const messageDocRef = doc(db, `chats/${roomId}/messages/${messageId}`);
      await deleteDoc(messageDocRef);
      
      if (socketRef.current) {
        socketRef.current.emit('delete_message', { roomId, messageId });
      }
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (onMessageDelete) onMessageDelete(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const editMessage = (messageId: string, currentText: string) => {
    handleEditMessage(
      messageId,
      currentText,
      setEditingMessageId,
      setEditedMessageText
    );
  };

  const saveEdit = async () => {
    try {
      await saveEditedMessage(
        editingMessageId,
        editedMessageText,
        handlersProps,
        setEditingMessageId,
        setEditedMessageText
      );
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Une erreur est survenue lors de la modification du message");
    }
  };

  const replyToMessage = (messageId: string, userName: string, messageText: string) => {
    handleReply(
      messageId,
      userName,
      messageText,
      (reply) => setReplyingTo(reply ? {
        ...reply,
        userId: currentUser.uid
      } : null),
      setDropdownOpen,
      currentUser.uid
    );
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageText('');
  };

  const toggleExpandMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  if (loading) {
    return <div className={`p-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chargement des messages...</div>;
  }

  return (
    <div className={`flex flex-col h-full gap-4 ${darkMode ? 'dark' : ''} ${customStyles?.container || ''}`}>
      <div className={`flex flex-col flex-grow p-4 space-y-4 overflow-y-auto rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} ${customStyles?.message || ''}`}>
        {messages.map((msg, index) => {
          const showDateSeparator = shouldShowDateSeparator(
            msg,
            index > 0 ? messages[index - 1] : undefined
          );

          const isExpanded = expandedMessage === msg.id;
          const displayText = isExpanded ? msg.text : truncateText(msg.text, MAX_LENGTH);
          const isCurrentUserMessage = msg.userID === currentUser.uid;
          const isAdmin = Role === 'admin';
          const canDelete = isCurrentUserMessage || isAdmin;
          const canEdit = isCurrentUserMessage;
          
          return (
            <div key={msg.id} id={`message-${msg.id}`}>
              {showDateSeparator && (
                <div key={`date-${msg.id}`} className="flex items-center my-4">
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                  <span className={`px-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(msg.timestamp)}
                  </span>
                  <div className={`flex-grow border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                </div>
              )}
              
              <div className="flex flex-row">
                <div className={`flex items-start pt-1 flex-shrink-0 w-8 h-8 mr-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <FaUserAlt className={`m-auto text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  {msg.replyTo && (
                    <div 
                      className={`text-xs mb-1 px-2 py-1 rounded cursor-pointer ${darkMode ? 'text-blue-300 hover:text-blue-200 bg-gray-700' : 'text-blue-500 hover:text-blue-600 bg-gray-100'}`}
                      onClick={() => scrollToMessage(msg.replyTo?.messageId || '')}
                    >
                      <FaReply className="inline mr-1" />
                      Réponse à {msg.replyTo.userName}: "{msg.replyTo.preview}"
                    </div>
                  )}
                  
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
                        className={`${darkMode ? 'bg-white-700 text-white' : 'bg-white text-gray-900'} ${customStyles?.input || ''}`}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onPress={saveEdit}
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

                      {(msg.editedAt || msg.isEdited) && (
                        <div className="flex items-center mt-1">
                          <span className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            modifié
                          </span>
                          {msg.editedAt && (
                            <span className={`ml-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatDateTime(msg.editedAt)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === msg.id ? null : msg.id)}
                          className={`${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                          aria-label="Options"
                        >
                          <FaEllipsisV className="text-sm" />
                        </button>

                        {dropdownOpen === msg.id && (
                          <div className={`absolute right-0 top-6 z-10 w-40 rounded-md shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="py-1">
                              {!isCurrentUserMessage && (
                                <button
                                  onClick={() => replyToMessage(msg.id, msg.user, msg.text)}
                                  className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                  <FaReply className="inline mr-2" />
                                  Répondre
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => editMessage(msg.id, msg.text)}
                                  className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                  <FaEdit className="inline mr-2" />
                                  Modifier
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-red-300 hover:bg-gray-600' : 'text-red-500 hover:bg-gray-100'}`}
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.text.length > MAX_LENGTH && !editingMessageId && (
                    <div className="mt-1">
                      <button
                        onClick={() => toggleExpandMessage(msg.id)}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                          darkMode 
                            ? 'text-blue-300 hover:text-blue-200 hover:bg-gray-700' 
                            : 'text-blue-500 hover:text-blue-600 hover:bg-gray-100'
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <span>Voir moins</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Voir plus</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="text-sm">
            <FaReply className="inline mr-1" />
            Réponse à {replyingTo.userName}: "{truncateText(replyingTo.preview, 30)}"
          </div>
          <button 
            onClick={() => setReplyingTo(null)}
            className={`text-xs ${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            × Annuler
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          id="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Écrivez un message"
          className={`flex-grow ${darkMode ? 'bg-white-700 text-white placeholder-gray-400 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${customStyles?.input || ''}`}
        />
        <Button 
          onPress={sendMessage} 
          className={darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}
        >
          Envoyer
        </Button>
      </div>

      {children}
    </div>
  );
}