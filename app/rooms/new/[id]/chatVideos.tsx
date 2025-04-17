'use client';

import { useState, useEffect } from "react";
import { Card } from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { db } from '@/firebase';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

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

  const messagesRef = collection(db, `chats/${roomId}/wait_links`);
  const histRef = collection(db, `chats/${roomId}/hist_links`);

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

  const getVideoPreview = (url: string) => {
    const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const matchYoutube = url.match(youtubePattern);

    if (matchYoutube) {
      const videoId = matchYoutube[1];
      return (
        <iframe
          width="200"
          height="113"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Preview"
        ></iframe>
      );
    }

    const vimeoPattern = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const matchVimeo = url.match(vimeoPattern);

    if (matchVimeo) {
      const videoId = matchVimeo[1];
      return (
        <iframe
          width="200"
          height="113"
          src={`https://player.vimeo.com/video/${videoId}`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video Preview"
        ></iframe>
      );
    }

    return null;
  };

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
  };

  useEffect(() => {
    if (viewMode === 'chat') {
      fetchMessages();
    } else {
      fetchHistory();
    }
  }, [roomId, viewMode]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const isVideoLink = getVideoPreview(newMessage);

    if (isVideoLink) {
      try {
        await addDoc(messagesRef, {
          text: newMessage,
          user: currentUser,
          timestamp: serverTimestamp(),
        });
        fetchMessages();
      } catch (error) {
        console.error("Erreur d'envoi:", error);
      }
    }

    setNewMessage("");
  };

  const handleDeleteMessage = async (id: string) => {
    if (admin === currentUser) {
      try {
        await deleteDoc(doc(db, `chats/${roomId}/wait_links/${id}`));
        fetchMessages();
      } catch (error) {
        console.error("Erreur de suppression:", error);
      }
    }
  };

  const toggleExpandMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  // 👇 Automatisation du déplacement du lien le plus vieux vers hist_links
  useEffect(() => {
    const interval = setInterval(async () => {
      if (viewMode === 'chat' && videoLinks.length > 0) {
        const oldest = videoLinks[0];

        try {
          // Ajouter à hist_links
          await addDoc(histRef, {
            text: oldest.text,
            user: oldest.user,
            timestamp: oldest.timestamp,
          });

          // Supprimer de wait_links
          await deleteDoc(doc(db, `chats/${roomId}/wait_links/${oldest.id}`));

          // Mettre à jour la liste
          fetchMessages();
        } catch (error) {
          console.error("Erreur de déplacement vers historique:", error);
        }
      }
    }, 10000); // toutes les 10 secondes

    return () => clearInterval(interval);
  }, [videoLinks, viewMode, roomId]);

  const MAX_LENGTH = 100;

  return (
    <div>
      <h1 className="text-xl font-bold text-center p-4 bg-grey-100 shadow-md">Espace de Chat Video</h1>

      <div className="flex justify-between p-4">
        <Button onClick={() => setViewMode('history')} className="w-full bg-blue-500 text-white py-2 px-4 rounded-md">
          Historique
        </Button>
        <Button onClick={() => setViewMode('chat')} className="w-full bg-green-500 text-white py-2 px-4 rounded-md">
          Liste de vidéos
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-white">
        {viewMode === 'history' ? (
          messages.map((msg) => (
            <Card key={msg.id} className="p-2 relative">
              <p className="font-semibold">{msg.user}</p>
              <p>{msg.text}</p>
              {getVideoPreview(msg.text)}
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
                <p>{truncatedText}</p>
                {getVideoPreview(msg.text)}
                {msg.text.length > MAX_LENGTH && (
                  <Button
                    onPress={() => toggleExpandMessage(msg.id)}
                    className="text-blue-500 text-sm underline p-0 ml-2 inline-flex items-center"
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
        <div className="p-4 bg-white flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un lien vidéo..."
            className="flex-grow"
          />
          <Button onClick={sendMessage} className="flex items-center gap-2">
            Envoyer
          </Button>
        </div>
      )}
    </div>
  );
}
