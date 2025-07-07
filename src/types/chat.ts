
export type ChatType = 'general' | 'team' | 'private';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'leader' | 'user';
  avatar?: string;
  isOnline: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: User[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'audio' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  mentions?: string[];
  reactions?: { [emoji: string]: string[] };
  edited?: boolean;
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  teamId?: string;
}

export interface ChatContextType {
  chats: Chat[];
  teams: Team[];
  users: User[];
  currentUser: User | null;
  filteredChats: Chat[];
  replyingTo: Message | null;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  markAsRead: (chatId: string) => void;
  createPrivateChat: (userId: string) => Chat;
  updateUserStatus: (userId: string, isOnline: boolean) => void;
  searchChats: (query: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string, userId: string) => void;
  playNotificationSound: () => void;
  setReplyingTo: (message: Message | null) => void;
}
