'use client';

import { useState, useEffect } from "react";
import { Card } from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { db } from '@/firebase';
import {collection,addDoc,getDocs,serverTimestamp,deleteDoc,doc,getDoc} from "firebase/firestore";

type Message = {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
};

type Props = {
  roomId: string;
  currentUser?: string;
  initialMessages?: Message[];
  Role?: 'admin' | 'user';
};

export default function ChatVideos({
  roomId,
  currentUser = '2',
  initialMessages = [],
  Role
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'history' | 'chat'>('chat');
  const [videoLinks, setVideoLinks] = useState<Message[]>([]);
  const [admin, setAdmin] = useState<string | null>(null);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});

  const messagesRef = collection(db, `chats/${roomId}/wait_links`);
  const histRef = collection(db, `chats/${roomId}/hist_links`);
  const lectureRef = collection(db, `chats/${roomId}/lecture`);

  // Fonction pour extraire l'ID de la vidéo en fonction de la plateforme
  const extractVideoInfo = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        // YouTube
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return {
          platform: 'youtube',
          id: match && match[2].length === 11 ? match[2] : null
        };
      } else if (hostname.includes('dailymotion.com') || hostname.includes('dai.ly')) {
        // Dailymotion
        const regExp = /^.*(dailymotion.com\/video\/|dai.ly\/)([^_]+).*/;
        const match = url.match(regExp);
        return {
          platform: 'dailymotion',
          id: match ? match[2] : null
        };
      } else if (hostname.includes('twitch.tv')) {
        // Twitch
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        return {
          platform: 'twitch',
          id: pathParts.length > 0 ? pathParts[0] : null
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
      console.error("Error fetching video title:", error);
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

  const fetchMessages = async () => {
    const snapshot = await getDocs(messagesRef);
    const links: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        user: data.user,
        timestamp: data.timestamp?.toDate?.() || new Date(),
      };
    });
    links.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setVideoLinks(links);
    fetchVideoTitles(links);
  };

  const fetchHistory = async () => {
    const snapshot = await getDocs(histRef);
    const fetched: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        user: data.user,
        timestamp: data.timestamp?.toDate?.() || new Date(),
      };
    });
    fetched.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setMessages(fetched);
    fetchVideoTitles(fetched);
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

  const isVideoLink = (url: string) => {
    const { platform, id } = extractVideoInfo(url);
    return !!platform && !!id;
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    if (isVideoLink(newMessage)) {
      try {
        const isLectureEmpty = await checkLectureEmpty();
        
        if (isLectureEmpty) {
          await addDoc(lectureRef, {
            text: newMessage,
            user: currentUser,
            timestamp: serverTimestamp(),
          });
        } else {
          await addDoc(messagesRef, {
            text: newMessage,
            user: currentUser,
            timestamp: serverTimestamp(),
          });
          await fetchMessages();
        }
      } catch (error) {
        console.error("Erreur d'envoi:", error);
      }
    }

    setNewMessage("");
  };

  const handleDeleteMessage = async (id: string) => {
    if (admin === currentUser || Role === 'admin') {
      try {
        await deleteDoc(doc(db, `chats/${roomId}/wait_links/${id}`));
        fetchMessages();
      } catch (error) {
        console.error("Erreur de suppression:", error);
      }
    }
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
            timestamp: serverTimestamp(),
          });

          await deleteDoc(doc(db, `chats/${roomId}/wait_links/${oldest.id}`));

          await fetchMessages();
        } catch (error) {
          console.error("Erreur de déplacement vers lecture:", error);
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
    <div className="flex flex-col h-full">
      <h1 className="text-xl font-bold text-center p-4 bg-gray-100 dark:bg-gray-800 shadow-md">
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

      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
        {viewMode === 'history' ? (
          messages.map((msg) => (
            <Card key={msg.id} className="p-4 relative dark:bg-gray-800">
              <p className="font-semibold dark:text-white">{msg.user}</p>
              <p className="dark:text-gray-300">{msg.text}</p>
              {videoTitles[msg.id] && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {videoTitles[msg.id]}
                </p>
              )}
            </Card>
          ))
        ) : (
          videoLinks.map((msg) => {
            const isMessageExpanded = expandedMessage === msg.id;
            const truncatedText =
              msg.text.length > MAX_LENGTH && !isMessageExpanded
                ? msg.text.slice(0, MAX_LENGTH) + "..."
                : msg.text;

            return (
              <Card key={msg.id} className="p-4 relative dark:bg-gray-800">
                <p className="font-semibold dark:text-white">{msg.user}</p>
                {(admin === currentUser || Role === 'admin') && (
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
                <p className="dark:text-gray-300">{truncatedText}</p>
                {videoTitles[msg.id] && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {videoTitles[msg.id]}
                  </p>
                )}
                {msg.text.length > MAX_LENGTH && (
                  <Button
                    onPress={() => toggleExpandMessage(msg.id)}
                    className="text-blue-500 dark:text-blue-400 text-sm underline p-0 ml-2 inline-flex items-center"
                  >
                    {isMessageExpanded ? "Voir moins" : "Voir plus"}
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>

      {viewMode === 'chat' && (
        <div className="p-4 bg-white dark:bg-gray-800 flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un lien vidéo (YouTube, Dailymotion, Twitch)..."
            className="flex-grow dark:bg-gray-700 dark:text-white"
          />
          <Button 
            onClick={sendMessage} 
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
            disabled={!isVideoLink(newMessage)}
          >
            Envoyer
          </Button>
        </div>
      )}
    </div>
  );
}