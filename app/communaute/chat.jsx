'use client'
import { useState } from "react";
import {Card} from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

export default function ChatCommu({Message,Role}) {

  const [messages, setMessages] = useState(Message);
  const [newMessage, setNewMessage] = useState("");
  const [expandedMessage, setExpandedMessage] = useState(null);
  const User1 = "Alexis"
  const sendMessage = () => {
    //A changer pour base de données 
    if (newMessage.trim() !== "") {
      setMessages([...messages, { id: Date.now(), text: newMessage, user: User1 }]);
      setNewMessage("");
    }
  };

  const deleteMessage = (id) => {
    //changer BDD
    setMessages(messages.filter((msg) => msg.id !== id));
  };


  const MAX_LENGTH = 100;
  const toggleExpandMessage = (id) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };
  return (
    <div className="">
      <div className="">
        <h1 className="text-xl font-bold text-center p-4 bg-grey-100 shadow-md">Espace de Chat</h1>
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-white">
        {messages.map((msg) => {
            const isMessageExpanded = expandedMessage === msg.id;
            const truncatedText = msg.text.length > MAX_LENGTH && !isMessageExpanded 
              ? msg.text.slice(0, MAX_LENGTH) + "..." 
              : msg.text;

            return (
              <Card key={msg.id} className="p-2">
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
    </div>
  );
}

