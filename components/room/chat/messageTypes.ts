import { collection, DocumentReference } from 'firebase/firestore';
import { Socket } from 'socket.io-client';
import { ReactNode, Dispatch, SetStateAction } from 'react';

/**
 * Types pour les messages et la gestion du chat
 */

// Type pour les pièces jointes
export type Attachment = {
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
};

// Type pour les messages cités/réponses
export type MessageReply = {
  messageId: string;
  userId: string;
  userName: string;
  preview: string;
  text?: string; // Texte complet optionnel
};

// Statut possible d'un message
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

// Type principal pour un message de chat
export type ChatMessage = {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
  userID: string;
  editedAt?: Date;
  isEdited?: boolean;
  replyTo?: MessageReply;
  attachments?: Attachment[];
  status?: MessageStatus;
  reactions?: Record<string, string[]>; // { "emoji": ["userId1", "userId2"] }
};

// Props pour les handlers de message
export interface MessageHandlersProps {
  roomId: string;
  username: string;
  Role?: 'admin' | 'user' | 'moderator';
  messagesRef: ReturnType<typeof collection>;
  socketRef: React.RefObject<Socket | null>;
  communityId?: string | null;
  setMessages?: Dispatch<SetStateAction<ChatMessage[]>>;
  messages?: ChatMessage[];
  currentUser?: {
    uid: string;
    displayName: string;
    isGuest?: boolean;
  };
}

// Props pour le composant principal de chat
export interface ChatRoomSocketProps {
  roomId: string;
  username: string;
  Role?: 'admin' | 'user' | 'moderator';
  darkMode?: boolean;
  children?: ReactNode;
  onMessageSend?: (message: ChatMessage) => void;
  onMessageDelete?: (messageId: string) => void;
  customStyles?: {
    container?: string;
    message?: string;
    input?: string;
  };
}

// Type pour les options de configuration du chat
export interface ChatConfig {
  maxMessageLength?: number;
  allowAttachments?: boolean;
  allowedFileTypes?: string[];
  maxFileSize?: number; // en Mo
  enableReactions?: boolean;
  enableThreads?: boolean;
  readReceipts?: boolean;
}

// Type pour les événements du socket
export type SocketEvent = {
  type: 'message' | 'edit' | 'delete' | 'reaction' | 'typing';
  payload: any;
  timestamp: number;
  userId: string;
};

// Type pour les props des composants UI de message
export interface MessageComponentProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onEdit: (messageId: string, newText: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  darkMode?: boolean;
}

// Type pour les statistiques de chat
export type ChatStats = {
  messageCount: number;
  activeUsers: number;
  firstMessageDate?: Date;
  lastMessageDate?: Date;
};