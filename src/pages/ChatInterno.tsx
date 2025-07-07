
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatProvider } from "@/contexts/ChatContext";

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

const ChatInterno = () => {
  const { user, loading } = useAuth();
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <ChatSidebar 
          activeChat={activeChat}
          onChatSelect={setActiveChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 flex flex-col">
          <ChatArea 
            activeChat={activeChat}
            currentUser={user}
          />
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatInterno;
