import { 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/app/firebase';
import { ChatMessage, MessageHandlersProps, MessageReply } from './messageTypes';

export const handleSendMessage = async (
  text: string,
  replyingTo: MessageReply | null,
  props: MessageHandlersProps,
  setNewMessage: (msg: string) => void,
  setReplyingTo: (reply: MessageReply | null) => void
): Promise<ChatMessage | undefined> => {
  if (!text.trim()) return;

  try {
    const auth = getAuth();
    const user = auth.currentUser;

    let displayName = user?.displayName || props.username;
    if (!user) displayName = localStorage.getItem('guestName') || 'Invité';

    const userID = user?.uid || 'anonymous';
    const requiresAuth = !!props.communityId;

    const messageData: Omit<ChatMessage, 'id' | 'timestamp'> & { 
      timestamp: ReturnType<typeof serverTimestamp>,
      requiresAuth?: boolean 
    } = {
      text,
      user: displayName,
      userID,
      timestamp: serverTimestamp(),
      requiresAuth,
      isEdited: false,
      status: 'delivered'
    };

    if (replyingTo) {
      messageData.replyTo = {
        messageId: replyingTo.messageId,
        userId: replyingTo.userId,
        userName: replyingTo.userName,
        preview: replyingTo.preview.substring(0, 30) + (replyingTo.preview.length > 30 ? '...' : '')
      };
    }

    const newDoc = await addDoc(props.messagesRef, messageData);

    const createdMessage: ChatMessage = {
      id: newDoc.id,
      text,
      user: displayName,
      userID,
      timestamp: new Date(),
      isEdited: false,
      status: 'delivered',
      replyTo: replyingTo ? {
        messageId: replyingTo.messageId,
        userId: replyingTo.userId,
        userName: replyingTo.userName,
        preview: replyingTo.preview.substring(0, 30) + (replyingTo.preview.length > 30 ? '...' : '')
      } : undefined
    };

    if (props.socketRef.current) {
      props.socketRef.current.emit('send_message', { 
        roomId: props.roomId, 
        message: createdMessage
      });
    }

    setNewMessage('');
    setReplyingTo(null);
    
    return createdMessage;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const handleDeleteMessage = async (
  id: string,
  props: MessageHandlersProps
) => {
  if (!props.messages) return;
  
  const canDelete = props.Role === 'admin' || 
                   props.messages.find(msg => msg.id === id)?.user === props.username;
  
  if (!canDelete) return;

  try {
    await deleteDoc(doc(db, `chats/${props.roomId}/messages/${id}`));
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

export const handleEditMessage = (
  messageId: string, 
  currentText: string,
  setEditingMessageId: (id: string | null) => void,
  setEditedMessageText: (text: string) => void
) => {
  setEditingMessageId(messageId);
  setEditedMessageText(currentText);
};

export const saveEditedMessage = async (
  editingMessageId: string | null,
  editedMessageText: string,
  props: MessageHandlersProps,
  setEditingMessageId: (id: string | null) => void,
  setEditedMessageText: (text: string) => void
) => {
  if (!editingMessageId || !editedMessageText.trim()) return;

  try {
    const messageRef = doc(db, `chats/${props.roomId}/messages/${editingMessageId}`);
    await updateDoc(messageRef, {
      text: editedMessageText,
      editedAt: serverTimestamp(),
      isEdited: true
    });

    if (props.socketRef.current) {
      props.socketRef.current.emit('edit_message', {
        roomId: props.roomId,
        messageId: editingMessageId,
        newText: editedMessageText,
        editedAt: new Date().toISOString(),
        isEdited: true
      });
    }

    setEditingMessageId(null);
    setEditedMessageText('');
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
};

export const handleReply = (
  messageId: string,
  userName: string,
  messageText: string,
  setReplyingTo: (reply: MessageReply | null) => void,
  setDropdownOpen: (id: string | null) => void,
  userId: string
) => {
  setReplyingTo({
    messageId,
    userId,
    userName,
    preview: messageText
  });
  setDropdownOpen(null);
  document.getElementById('message-input')?.focus();
};