
import { useState, useCallback } from 'react';
import { Chat, Message, User } from '@/types/chat';

export const useChatMessages = (initialChats: Chat[], currentUser: User | null) => {
  const [chats, setChats] = useState<Chat[]>(initialChats);

  const addMessage = useCallback((chatId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
    console.log('Adicionando mensagem:', { chatId, messageData });
    
    const newMessage: Message = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    console.log('Nova mensagem criada:', newMessage);

    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: newMessage,
            unreadCount: messageData.senderId !== currentUser?.id ? chat.unreadCount + 1 : chat.unreadCount
          };
          console.log('Chat atualizado:', updatedChat);
          return updatedChat;
        }
        return chat;
      });
      
      console.log('Todos os chats após atualização:', updatedChats);
      return updatedChats;
    });
  }, [currentUser?.id]);

  const markAsRead = useCallback((chatId: string) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  }, []);

  const addReaction = useCallback((chatId: string, messageId: string, emoji: string, userId: string) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map(message =>
                message.id === messageId
                  ? {
                      ...message,
                      reactions: {
                        ...message.reactions,
                        [emoji]: message.reactions?.[emoji] 
                          ? message.reactions[emoji].includes(userId)
                            ? message.reactions[emoji].filter(id => id !== userId)
                            : [...message.reactions[emoji], userId]
                          : [userId]
                      }
                    }
                  : message
              )
            }
          : chat
      )
    );
  }, []);

  return {
    chats,
    setChats,
    addMessage,
    markAsRead,
    addReaction
  };
};
