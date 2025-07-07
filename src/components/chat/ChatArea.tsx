
import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Chat } from "@/pages/ChatInterno";
import { useChatContext } from "@/contexts/ChatContext";
import { Globe, Users, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatAreaProps {
  activeChat: Chat | null;
  currentUser: any; // Using any to avoid type conflicts between auth user and chat user
}

export const ChatArea = ({ activeChat, currentUser }: ChatAreaProps) => {
  const { markAsRead, teams, currentUser: chatCurrentUser } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChat && activeChat.unreadCount > 0) {
      markAsRead(activeChat.id);
    }
  }, [activeChat, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bem-vindo ao Chat Interno
          </h2>
          <p className="text-gray-600">
            Selecione uma conversa para começar a conversar
          </p>
        </div>
      </div>
    );
  }

  const team = activeChat.teamId ? teams.find(t => t.id === activeChat.teamId) : null;

  const getChatIcon = () => {
    switch (activeChat.type) {
      case 'general':
        return <Globe className="h-6 w-6 text-green-600" />;
      case 'team':
        return team ? <span className="text-2xl">{team.icon}</span> : <Users className="h-6 w-6" />;
      case 'private':
        return <MessageCircle className="h-6 w-6" />;
      default:
        return <MessageCircle className="h-6 w-6" />;
    }
  };

  const getChatDescription = () => {
    switch (activeChat.type) {
      case 'general':
        return `Canal geral • ${activeChat.participants.length} membros`;
      case 'team':
        return team ? `${team.description} • ${activeChat.participants.length} membros` : 'Equipe';
      case 'private':
        const otherParticipant = activeChat.participants.find(p => p.id !== chatCurrentUser?.id);
        return otherParticipant?.isOnline ? 'Online' : 'Offline';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getChatIcon()}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeChat.name}
              </h1>
              <p className="text-sm text-gray-600">
                {getChatDescription()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={activeChat.messages}
          currentUser={chatCurrentUser}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput 
        chatId={activeChat.id}
        currentUser={chatCurrentUser}
      />
    </div>
  );
};
