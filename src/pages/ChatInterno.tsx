
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatProvider } from "@/contexts/ChatContext";
import { Chat } from "@/types/chat";

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
