'use client';

import { useState } from "react";
import { Card } from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

type MessageType = {
  id: number;
  text: string;
  user: string;
};

type Props = {
  Message: MessageType[];
  Role: "admin" | "user" | string;
};

export default function ChatVideos({ Message, Role }: Props) {
  const [messages, setMessages] = useState<MessageType[]>(Message);
  const [newMessage, setNewMessage] = useState<string>("");
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'history' | 'chat'>('chat'); // Mode d'affichage, "history" ou "chat"

  const User1 = "Mirmyr";

  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, { id: Date.now(), text: newMessage, user: User1 }]);
      setNewMessage("");
    }
  };

  const deleteMessage = (id: number) => {
    setMessages(messages.filter((msg) => msg.id !== id));
  };

  const toggleExpandMessage = (id: number) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  const MAX_LENGTH = 100;

  // Fonction pour extraire un lien vidéo
  const getVideoPreview = (url: string) => {
    const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.*|(?:v|e(?:mbed)?)\/([a-zA-Z0-9_-]+)))|(?:youtu\.be\/([a-zA-Z0-9_-]+))/;
    const matchYoutube = url.match(youtubePattern);

    if (matchYoutube) {
      const videoId = matchYoutube[1] || matchYoutube[2];
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

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold text-center p-4 bg-grey-100 shadow-md">Espace de Chat Video</h1>

        {/* Conteneur pour les boutons "Historique" et "Liste de vidéos" */}
        <div className="flex justify-between p-4">
          {/* Bouton Historique */}
          <Button onClick={() => setViewMode('history')} className="w-full bg-blue-500 hover:bg-grey-600 text-white py-2 px-4 rounded-md">
            Historique
          </Button>

          {/* Bouton Liste de vidéos */}
          <Button onClick={() => setViewMode('chat')} className="w-full bg-green-500 hover:bg-black-600 text-white py-2 px-4 rounded-md">
            Liste de vidéos
          </Button>
        </div>

        {/* Affichage du chat ou de l'historique en fonction du mode */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-white">
          {viewMode === 'history' ? (
            // Affichage de l'historique des vidéos lues
            messages.map((msg) => (
              <Card key={msg.id} className="p-2 relative">
                <p className="font-semibold">{msg.user}</p>
                <p>{msg.text}</p>
                {getVideoPreview(msg.text)}
              </Card>
            ))
          ) : (
            // Affichage du chat pour ajouter de nouveaux messages
            messages.map((msg) => {
              const isMessageExpanded = expandedMessage === msg.id;
              const truncatedText =
                msg.text.length > MAX_LENGTH && !isMessageExpanded
                  ? msg.text.slice(0, MAX_LENGTH) + "..."
                  : msg.text;

              return (
                <Card key={msg.id} className="p-2 relative">
                  <p className="font-semibold">{msg.user}</p>
                  {Role === "admin" && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => deleteMessage(msg.id)}
                      className="min-w-unit-6 h-unit-6 absolute top-1 right-1 text-lg leading-none"
                    >
                      ×
                    </Button>
                  )}
                  <p>{truncatedText}</p>
                  {/* Si c'est un lien vidéo, afficher la prévisualisation */}
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

        {/* Zone d'entrée pour envoyer un message */}
        {viewMode === 'chat' && (
          <div className="p-4 bg-white flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez un lien vidéo..."
              className="flex-grow"
            />
            <Button onPress={sendMessage} className="flex items-center gap-2">
              Envoyer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
