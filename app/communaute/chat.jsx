"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Card } from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { db } from "@/firebase";

export default function ChatCommu({ Role, roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [expandedMessage, setExpandedMessage] = useState(null);
  const User1 = "Alexis"; // Remplace par l'utilisateur actuel

  const messagesRef = collection(db, `chats/${roomId}/messages`);

  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(loadedMessages);
    });

    return () => unsubscribe(); // Nettoie l'écouteur quand le composant est démonté
  }, [roomId]);

  const sendMessage = async () => {
    if (newMessage.trim() !== "") {
      await addDoc(messagesRef, {
        text: newMessage,
        user: User1,
        timestamp: Date.now(),
      });
      setNewMessage(""); // Réinitialiser le champ après l'envoi
    }
  };

  const deleteMessage = async (id) => {
    if (Role === "admin") {
      await deleteDoc(doc(db, `chats/${roomId}/messages`, id));
    }
  };

  const MAX_LENGTH = 50;
  const toggleExpandMessage = (id) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  return (
    <div className="">
      <h1 className="text-xl font-bold text-center p-4 bg-grey-100 shadow-md">
        Espace de Chat
      </h1>
      <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-white">
        {messages.map((msg) => {
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
                  className="absolute top-1 right-1 text-lg leading-none"
                >
                  ×
                </Button>
              )}
              <p>{truncatedText}</p>
              {msg.text.length > MAX_LENGTH && (
                <Button
                  onPress={() => toggleExpandMessage(msg.id)}
                  className="text-blue-500 text-sm underline p-0 ml-2 inline-flex items-center w-1"
                >
                  {isMessageExpanded ? "Voir moins" : "Voir plus"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      <div className="p-4 bg-white flex space-x-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-grow"
        />
        <Button onPress={sendMessage} className="flex items-center gap-2">
          Envoyer
        </Button>
      </div>
    </div>
  );
}
