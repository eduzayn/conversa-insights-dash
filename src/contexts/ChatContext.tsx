
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ChatContextType, User, Team, Chat } from '@/types/chat';
import { mockUsers, mockTeams, mockChats } from '@/data/mockChatData';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatSearch } from '@/hooks/useChatSearch';
import { createPrivateChat as createPrivateChatUtil, playNotificationSound } from '@/utils/chatUtils';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [teams] = useState<Team[]>(mockTeams);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser] = useState<User | null>(mockUsers[0]); // Ana Lúcia como usuário atual

  const { chats, setChats, addMessage: addMessageHook, markAsRead, addReaction } = useChatMessages(mockChats, currentUser);
  const { filteredChats, searchChats } = useChatSearch(chats);

  const addMessage = useCallback((chatId: string, messageData: Omit<import('@/types/chat').Message, 'id' | 'timestamp'>) => {
    addMessageHook(chatId, messageData);

    // Tocar som de notificação se não for do usuário atual
    if (messageData.senderId !== currentUser?.id) {
      playNotificationSound();
    }
  }, [addMessageHook, currentUser?.id]);

  const createPrivateChat = useCallback((userId: string): Chat => {
    const newChat = createPrivateChatUtil(userId, users, currentUser, chats);
    
    // Se é um chat novo, adicionar à lista
    const existingChat = chats.find(chat => chat.id === newChat.id);
    if (!existingChat) {
      setChats(prev => [...prev, newChat]);
    }
    
    return newChat;
  }, [users, currentUser, chats, setChats]);

  const updateUserStatus = useCallback((userId: string, isOnline: boolean) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isOnline } : user
      )
    );
  }, []);

  return (
    <ChatContext.Provider value={{
      chats,
      filteredChats,
      teams,
      users,
      currentUser,
      addMessage,
      markAsRead,
      createPrivateChat,
      updateUserStatus,
      searchChats,
      addReaction,
      playNotificationSound
    }}>
      {children}
    </ChatContext.Provider>
  );
};
