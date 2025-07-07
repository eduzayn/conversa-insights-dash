
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chat, User, Team, Message } from '@/pages/ChatInterno';

interface ChatContextType {
  chats: Chat[];
  teams: Team[];
  users: User[];
  currentUser: User | null;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  markAsRead: (chatId: string) => void;
  createPrivateChat: (userId: string) => Chat;
  updateUserStatus: (userId: string, isOnline: boolean) => void;
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
  const [teams] = useState<Team[]>(mockTeams);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser] = useState<User | null>(mockUsers[0]); // Ana Lúcia como usuário atual

  const addMessage = (chatId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
              unreadCount: messageData.senderId !== currentUser?.id ? chat.unreadCount + 1 : chat.unreadCount
            }
          : chat
      )
    );
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

  return (
    <ChatContext.Provider value={{
      chats,
      teams,
      users,
      currentUser,
      addMessage,
      markAsRead,
      createPrivateChat,
      updateUserStatus
    }}>
      {children}
    </ChatContext.Provider>
  );
};
