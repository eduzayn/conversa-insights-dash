
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, User, Team, Message } from '@/pages/ChatInterno';

interface ChatContextType {
  chats: Chat[];
  teams: Team[];
  users: User[];
  currentUser: User | null;
  filteredChats: Chat[];
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  markAsRead: (chatId: string) => void;
  createPrivateChat: (userId: string) => Chat;
  updateUserStatus: (userId: string, isOnline: boolean) => void;
  searchChats: (query: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string, userId: string) => void;
  playNotificationSound: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Mock data para demonstração
const mockUsers: User[] = [
  { id: '1', name: 'Ana Lúcia', email: 'ana@empresa.com', role: 'admin', isOnline: true },
  { id: '2', name: 'João Pedro', email: 'joao@empresa.com', role: 'user', isOnline: true },
  { id: '3', name: 'Maria Souza', email: 'maria@empresa.com', role: 'leader', isOnline: false },
  { id: '4', name: 'Carlos Silva', email: 'carlos@empresa.com', role: 'user', isOnline: true },
];

const mockTeams: Team[] = [
  {
    id: 'comercial',
    name: 'Comercial',
    description: 'Equipe de vendas e relacionamento',
    icon: '💼',
    members: mockUsers.filter(u => ['1', '2'].includes(u.id))
  },
  {
    id: 'suporte',
    name: 'Suporte',
    description: 'Atendimento e suporte técnico',
    icon: '🛠️',
    members: mockUsers.filter(u => ['1', '3', '4'].includes(u.id))
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    description: 'Gestão e administração',
    icon: '🗂️',
    members: mockUsers.filter(u => ['1', '3'].includes(u.id))
  }
];

const mockChats: Chat[] = [
  {
    id: 'general',
    type: 'general',
    name: 'Geral',
    participants: mockUsers,
    messages: [
      {
        id: '1',
        senderId: '4',
        senderName: 'Carlos Silva',
        content: 'Bom dia pessoal! Como estão as vendas hoje?',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      },
      {
        id: '2',
        senderId: '1',
        senderName: 'Ana Lúcia',
        content: 'Bom dia Carlos! As vendas estão indo bem, batemos 80% da meta.',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text'
      }
    ],
    unreadCount: 0
  },
  {
    id: 'team-comercial',
    type: 'team',
    name: 'Comercial',
    participants: mockUsers.filter(u => ['1', '2'].includes(u.id)),
    messages: [
      {
        id: '3',
        senderId: '2',
        senderName: 'João Pedro',
        content: 'Ana, você viu o relatório do cliente X?',
        timestamp: new Date(Date.now() - 900000),
        type: 'text'
      }
    ],
    unreadCount: 1,
    teamId: 'comercial'
  }
];

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [filteredChats, setFilteredChats] = useState<Chat[]>(mockChats);
  const [teams] = useState<Team[]>(mockTeams);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser] = useState<User | null>(mockUsers[0]); // Ana Lúcia como usuário atual

  const addMessage = (chatId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
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

    // Tocar som de notificação se não for do usuário atual
    if (messageData.senderId !== currentUser?.id) {
      playNotificationSound();
    }
  };

  const markAsRead = (chatId: string) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  const createPrivateChat = (userId: string): Chat => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser || !currentUser) throw new Error('User not found');

    const existingChat = chats.find(
      chat => chat.type === 'private' && 
      chat.participants.some(p => p.id === userId) &&
      chat.participants.some(p => p.id === currentUser.id)
    );

    if (existingChat) return existingChat;

    const newChat: Chat = {
      id: `private-${currentUser.id}-${userId}`,
      type: 'private',
      name: targetUser.name,
      participants: [currentUser, targetUser],
      messages: [],
      unreadCount: 0
    };

    setChats(prev => [...prev, newChat]);
    return newChat;
  };

  const updateUserStatus = (userId: string, isOnline: boolean) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isOnline } : user
      )
    );
  };

  const searchChats = (query: string) => {
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
  };

  const addReaction = (chatId: string, messageId: string, emoji: string, userId: string) => {
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
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Erro ao reproduzir som de notificação:', error);
    }
  };

  // Atualizar filteredChats quando chats mudar
  useEffect(() => {
    console.log('Chats atualizados, sincronizando filteredChats:', chats);
    setFilteredChats(chats);
  }, [chats]);

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
