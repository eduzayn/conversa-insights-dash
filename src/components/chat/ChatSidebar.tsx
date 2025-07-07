
import { useState } from "react";
import { Search, Plus, MessageCircle, Users, Globe, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/types/chat";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ChatSidebar = ({ activeChat, onChatSelect, searchQuery, onSearchChange }: ChatSidebarProps) => {
  const { filteredChats, teams, users, currentUser, createPrivateChat, searchChats } = useChatContext();
  const [showPrivateChats, setShowPrivateChats] = useState(true);
  const [showTeamChats, setShowTeamChats] = useState(true);

  const generalChat = filteredChats.find(chat => chat.type === 'general');
  const teamChats = filteredChats.filter(chat => chat.type === 'team');
  const privateChats = filteredChats.filter(chat => chat.type === 'private');

  const filteredUsers = users.filter(user => 
    user.id !== currentUser?.id && 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (query: string) => {
    onSearchChange(query);
    searchChats(query);
  };

  const handleUserClick = (userId: string) => {
    const privateChat = createPrivateChat(userId);
    onChatSelect(privateChat);
  };

  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const isActive = activeChat?.id === chat.id;
    const team = chat.teamId ? teams.find(t => t.id === chat.teamId) : null;
    
    return (
      <div
        onClick={() => onChatSelect(chat)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
          "hover:bg-gray-100",
          isActive ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-700"
        )}
      >
        <div className="relative">
          {chat.type === 'general' && <Globe className="h-5 w-5 text-green-600" />}
          {chat.type === 'team' && team && <span className="text-lg">{team.icon}</span>}
          {chat.type === 'private' && <MessageCircle className="h-5 w-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium truncate">{chat.name}</h3>
            {chat.lastMessage && (
              <span className="text-xs text-gray-500">
                {formatLastMessageTime(chat.lastMessage.timestamp)}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p className="text-sm text-gray-500 truncate">
              {chat.lastMessage.senderName}: {chat.lastMessage.content}
            </p>
          )}
        </div>

        {chat.unreadCount > 0 && (
          <Badge className="bg-red-500 text-white text-xs px-2 py-1">
            {chat.unreadCount}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Chat Interno</h1>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* General Chat - aparece diretamente na lista */}
          {generalChat && (
            <div className="mb-4">
              <ChatItem chat={generalChat} />
            </div>
          )}

          {/* Team Chats */}
          {teamChats.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowTeamChats(!showTeamChats)}
                className="flex items-center gap-2 mb-2 text-gray-700 hover:text-gray-900"
              >
                {showTeamChats ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Users className="h-4 w-4" />
                <span className="font-medium">Equipes</span>
              </button>
              {showTeamChats && (
                <div className="space-y-1 ml-6">
                  {teamChats.map(chat => (
                    <ChatItem key={chat.id} chat={chat} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Private Chats */}
          <div className="mb-4">
            <button
              onClick={() => setShowPrivateChats(!showPrivateChats)}
              className="flex items-center gap-2 mb-2 text-gray-700 hover:text-gray-900"
            >
              {showPrivateChats ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">Conversas Privadas</span>
            </button>
            {showPrivateChats && (
              <div className="space-y-1 ml-6">
                {privateChats.map(chat => (
                  <ChatItem key={chat.id} chat={chat} />
                ))}
                
                {/* Available Users */}
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resultado da busca vazio */}
          {searchQuery && filteredChats.length === 0 && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum resultado encontrado</p>
              <p className="text-sm text-gray-400">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};
