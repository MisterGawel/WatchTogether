'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@heroui/react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { db } from '@/app/firebase';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

type Message = {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
  userID: string;
};

type Props = {
  roomId: string;
  currentUser?: string;
  initialMessages?: Message[];
  Role?: 'admin' | 'user';
  darkMode?: boolean;
};

export default function ChatVideos({
  roomId,
  currentUser = '2',
  initialMessages = [],
  Role,
  darkMode = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'history' | 'chat'>('chat');
  const [videoLinks, setVideoLinks] = useState<Message[]>([]);
  const [admin, setAdmin] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messagesRef = collection(db, `chats/${roomId}/wait_links`);
  const histRef = collection(db, `chats/${roomId}/hist_links`);
  const lectureRef = collection(db, `chats/${roomId}/lecture`);

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

  const extractVideoInfo = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return {
          platform: 'youtube',
          id: match && match[2].length === 11 ? match[2] : null,
        };
      } else if (hostname.includes('dailymotion.com') || hostname.includes('dai.ly')) {
        const regExp = /^.*(dailymotion.com\/video\/|dai.ly\/)([^_]+).*/;
        const match = url.match(regExp);
        return {
          platform: 'dailymotion',
          id: match ? match[2] : null,
        };
      } else if (hostname.includes('twitch.tv')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        return {
          platform: 'twitch',
          id: pathParts.length > 0 ? pathParts[0] : null,
        };
      }

      return { platform: null, id: null };
    } catch {
      return { platform: null, id: null };
    }
  };

  const getVideoInfo = async (url: string) => {
    try {
      const { platform, id } = extractVideoInfo(url);
      if (!id) return null;

      switch (platform) {
        case 'youtube':
          const youtubeResponse = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
          );
          const youtubeData = await youtubeResponse.json();
          return youtubeData.title;

        case 'dailymotion':
          const dmResponse = await fetch(
            `https://api.dailymotion.com/video/${id}?fields=title`
          );
          const dmData = await dmResponse.json();
          return dmData.title;

        case 'twitch':
          return `Twitch Stream: ${id}`;

        case 'vimeo':
          const vimeoResponse = await fetch(
            `https://vimeo.com/api/v2/video/${id}.json`
          );
          const vimeoData = await vimeoResponse.json();
          return vimeoData[0].title;

        default:
          return null;
      }
    } catch (error) {
      console.error('Error fetching video title:', error);
      return null;
    }
  };

  const getVideoThumbnail = async (url: string) => {
    try {
      const { platform, id } = extractVideoInfo(url);
      if (!id) return null;

      switch (platform) {
        case 'youtube':
          return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
        case 'dailymotion':
          return `https://www.dailymotion.com/thumbnail/video/${id}`;
        case 'twitch':
          return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${id}-320x180.jpg`;
        default:
          return null;
      }
    } catch (error) {
      console.error('Error fetching video thumbnail:', error);
      return null;
    }
  };

  const fetchVideoTitles = async (links: Message[]) => {
    const titles: Record<string, string> = {};
    for (const link of links) {
      const title = await getVideoInfo(link.text);
      if (title) {
        titles[link.id] = title;
      }
    }
    setVideoTitles(titles);
  };

  const fetchVideoThumbnails = async (links: Message[]) => {
    const thumbnails: Record<string, string> = {};
    for (const link of links) {
      const thumbnail = await getVideoThumbnail(link.text);
      if (thumbnail) {
        thumbnails[link.id] = thumbnail;
      }
    }
    setVideoThumbnails(thumbnails);
  };

  const fetchMessages = async () => {
    const snapshot = await getDocs(messagesRef);
    const links: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        user: data.user,
        userID: data.userID || '',
        timestamp: data.timestamp?.toDate?.() || new Date(),
      };
    });
    links.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setVideoLinks(links);
    fetchVideoTitles(links);
    fetchVideoThumbnails(links);
  };

  const fetchHistory = async () => {
    const snapshot = await getDocs(histRef);
    const fetched: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        user: data.user,
        userID: data.userID || '',
        timestamp: data.timestamp?.toDate?.() || new Date(),
      };
    });
    fetched.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setMessages(fetched);
    fetchVideoTitles(fetched);
    fetchVideoThumbnails(fetched);
  };

  const checkLectureEmpty = async () => {
    const lectureSnapshot = await getDocs(lectureRef);
    return lectureSnapshot.empty;
  };

  useEffect(() => {
    if (viewMode === 'chat') {
      fetchMessages();
    } else {
      fetchHistory();
    }
  }, [roomId, viewMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, videoLinks]);

  const isVideoLink = (url: string) => {
    const { platform, id } = extractVideoInfo(url);
    return !!platform && !!id;
  };

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      let userValue = '';
      let userIDValue = '';

      if (communityId) {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          alert("Vous devez être connecté pour envoyer un message dans cette room communautaire");
          return;
        }

        userValue = user.displayName || currentUser;
        userIDValue = user.uid;
      } else {
        userValue = currentUser;
        userIDValue = 'guest_' + currentUser;
      }

      if (isVideoLink(newMessage)) {
        const isLectureEmpty = await checkLectureEmpty();
        
        if (isLectureEmpty) {
          await addDoc(lectureRef, {
            text: newMessage,
            user: userValue,
            userID: userIDValue,
            timestamp: serverTimestamp(),
          });
        } else {
          await addDoc(messagesRef, {
            text: newMessage,
            user: userValue,
            userID: userIDValue,
            timestamp: serverTimestamp(),
          });
          await fetchMessages();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setNewMessage('');
  };

  const handleDeleteMessage = async (id: string) => {
    if (admin === currentUser || Role === 'admin' || videoLinks.find(video => video.id === id)?.userID === currentUser) {
      try {
        await deleteDoc(doc(db, `chats/${roomId}/wait_links/${id}`));
        fetchMessages();
      } catch (error) {
        console.error('Error deleting message:', error);
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
        userName: videoLinks.find(video => video.userID === userToBan)?.user || 'Unknown',
        timestamp: serverTimestamp(),
        bannedBy: currentUser,
        bannedAt: new Date().toISOString()
      });

      const userMessages = videoLinks.filter(msg => msg.userID === userToBan);
      for (const msg of userMessages) {
        await deleteDoc(doc(db, `chats/${roomId}/wait_links/${msg.id}`));
      }

      console.log(`User ${userToBan} banned successfully`);
      await fetchMessages();
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

  useEffect(() => {
    const checkAndMoveVideo = async () => {
      const isLectureEmpty = await checkLectureEmpty();

      if (isLectureEmpty && videoLinks.length > 0) {
        const oldest = videoLinks[0];

        try {
          await addDoc(lectureRef, {
            text: oldest.text,
            user: oldest.user,
            userID: oldest.userID,
            timestamp: serverTimestamp(),
          });

          await deleteDoc(
            doc(db, `chats/${roomId}/wait_links/${oldest.id}`)
          );

          await fetchMessages();
        } catch (error) {
          console.error('Error moving video to lecture:', error);
        }
      }
    };

    const interval = setInterval(checkAndMoveVideo, 10000);
    return () => clearInterval(interval);
  }, [videoLinks, viewMode, roomId]);

  const toggleExpandMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  const MAX_LENGTH = 100;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'dark' : ''}`}>
      <h1 className={`p-4 text-xl font-bold text-center shadow-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        Espace de Chat Video
      </h1>

      <div className="flex justify-between p-4">
        <Button
          onClick={() => setViewMode('history')}
          className={`w-full py-2 px-4 rounded-md ${viewMode === 'history' ? 'bg-blue-600' : 'bg-blue-500'} text-white`}
        >
          Historique
        </Button>
        <Button
          onClick={() => setViewMode('chat')}
          className={`w-full py-2 px-4 rounded-md ${viewMode === 'chat' ? 'bg-green-600' : 'bg-green-500'} text-white`}
        >
          Liste d'attente
        </Button>
      </div>

      <div 
        ref={chatContainerRef}
        className={`flex-grow p-4 space-y-4 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} custom-scrollbar`}
        style={{ maxHeight: '60vh' }}
      >
        {viewMode === 'history'
          ? messages.map((msg) => {
              const isCurrentUserMessage = msg.userID === currentUser;
              const cardClasses = `relative p-4 ${
                darkMode 
                  ? isCurrentUserMessage 
                    ? 'bg-gray-700'
                    : 'bg-gray-800'
                  : isCurrentUserMessage
                    ? 'bg-gray-100'
                    : 'bg-gray-50'
              }`;

              return (
                <Card
                  key={msg.id}
                  className={cardClasses}
                >
                  <div className="flex items-start gap-3">
                    {videoThumbnails[msg.id] && (
                      <img
                        src={videoThumbnails[msg.id]}
                        alt="Video thumbnail"
                        className="w-24 h-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {msg.user}
                      </p>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{msg.text}</p>
                      {videoTitles[msg.id] && (
                        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {videoTitles[msg.id]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex-1"></div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDateTime(msg.timestamp)}
                    </p>
                  </div>
                  {(admin === currentUser || Role === 'admin' || isCurrentUserMessage) && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteMessage(msg.id)}
                      className="absolute top-2 right-2"
                    >
                      ×
                    </Button>
                  )}
                </Card>
              );
            })
          : videoLinks.map((msg) => {
              const isMessageExpanded = expandedMessage === msg.id;
              const truncatedText =
                msg.text.length > MAX_LENGTH && !isMessageExpanded
                  ? msg.text.slice(0, MAX_LENGTH) + '...'
                  : msg.text;
              const isCurrentUserMessage = msg.userID === currentUser;
              
              const cardClasses = `relative p-4 ${
                darkMode 
                  ? isCurrentUserMessage 
                    ? 'bg-gray-700'
                    : 'bg-gray-800'
                  : isCurrentUserMessage
                    ? 'bg-gray-100'
                    : 'bg-gray-50'
              }`;

              return (
                <Card
                  key={msg.id}
                  className={cardClasses}
                >
                  <div className="flex items-start gap-3">
                    {videoThumbnails[msg.id] && (
                      <img
                        src={videoThumbnails[msg.id]}
                        alt="Video thumbnail"
                        className="w-24 h-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {msg.user}
                      </p>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {truncatedText}
                      </p>
                      {videoTitles[msg.id] && (
                        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {videoTitles[msg.id]}
                        </p>
                      )}
                      {msg.text.length > MAX_LENGTH && (
                        <Button
                          onPress={() => toggleExpandMessage(msg.id)}
                          className={`inline-flex items-center p-0 ml-2 text-sm underline ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}
                        >
                          {isMessageExpanded
                            ? 'Voir moins'
                            : 'Voir plus'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex-1"></div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDateTime(msg.timestamp)}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {(admin === currentUser || Role === 'admin' || isCurrentUserMessage) && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteMessage(msg.id)}
                        aria-label="Supprimer le message"
                      >
                        ×
                      </Button>
                    )}
                    {Role === 'admin' && msg.userID !== admin && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="warning"
                        onPress={() => handleBanClick(msg.userID)}
                        aria-label="Bannir l'utilisateur"
                      >
                        🚫
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
        <div ref={messagesEndRef} />
      </div>

      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-md w-full`}>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Confirmer le bannissement
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Êtes-vous sûr de vouloir bannir cet utilisateur ? Tous ses messages seront supprimés et il ne pourra plus accéder à la room.
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

      {viewMode === 'chat' && (
        <div className={`flex p-4 space-x-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              communityId 
                ? "Écrivez un lien vidéo (YouTube, Dailymotion, Twitch)"
                : "Écrivez un lien vidéo "
            }
            className={`flex-grow ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900'}`}
          />
          <Button
            onClick={sendMessage}
            className="flex items-center gap-2 text-white bg-purple-500 hover:bg-purple-600"
            disabled={!isVideoLink(newMessage)}
          >
            Envoyer
          </Button>
        </div>
      )}
    </div>
  );
}