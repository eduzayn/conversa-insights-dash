
import { useState, useCallback, useEffect } from 'react';
import { Chat } from '@/types/chat';

export const useChatSearch = (chats: Chat[]) => {
  const [filteredChats, setFilteredChats] = useState<Chat[]>(chats);

  const searchChats = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredChats(chats);
      return;
    }

    const filtered = chats.filter(chat => {
      // Buscar no nome do chat
      if (chat.name.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }

      // Buscar nas mensagens
      const hasMatchingMessage = chat.messages.some(message => 
        message.content.toLowerCase().includes(query.toLowerCase()) ||
        message.senderName.toLowerCase().includes(query.toLowerCase())
      );

      return hasMatchingMessage;
    });

    setFilteredChats(filtered);
  }, [chats]);

  // Atualizar filteredChats quando chats mudar
  useEffect(() => {
    console.log('Chats atualizados, sincronizando filteredChats:', chats);
    setFilteredChats(chats);
  }, [chats]);

  return {
    filteredChats,
    searchChats
  };
};
