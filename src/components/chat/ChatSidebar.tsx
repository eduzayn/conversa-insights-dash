
import { useState } from "react";
import { Plus, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "@/types/chat";
import { useChatContext } from "@/contexts/ChatContext";
import { NewChatModal } from "./NewChatModal";
import { ChatSearchBar } from "./ChatSearchBar";
import { ChatItem } from "./ChatItem";
import { ChatSection } from "./ChatSection";
import { UserListItem } from "./UserListItem";
import { ChatSidebarFooter } from "./ChatSidebarFooter";

interface ChatSidebarProps {
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ChatSidebar = ({ activeChat, onChatSelect, searchQuery, onSearchChange }: ChatSidebarProps) => {
  const { filteredChats, users, currentUser, createPrivateChat, searchChats } = useChatContext();
  const [showNewChatModal, setShowNewChatModal] = useState(false);

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

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Chat Interno</h1>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowNewChatModal(true)}
            title="Nova Conversa"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ChatSearchBar 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* General Chat */}
          {generalChat && (
            <div className="mb-4">
              <ChatItem 
                chat={generalChat} 
                isActive={activeChat?.id === generalChat.id}
                onSelect={onChatSelect}
              />
            </div>
          )}

          {/* Team Chats */}
          {teamChats.length > 0 && (
            <ChatSection
              title="Equipes"
              icon={Users}
              chats={teamChats}
              activeChat={activeChat}
              onChatSelect={onChatSelect}
            />
          )}

          {/* Private Chats */}
          <ChatSection
            title="Conversas Privadas"
            icon={MessageCircle}
            chats={privateChats}
            activeChat={activeChat}
            onChatSelect={onChatSelect}
          >
            {/* Available Users */}
            {filteredUsers.map(user => (
              <UserListItem
                key={user.id}
                user={user}
                onClick={handleUserClick}
              />
            ))}
          </ChatSection>

          {/* Empty Search Results */}
          {searchQuery && filteredChats.length === 0 && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum resultado encontrado</p>
              <p className="text-sm text-gray-400">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </div>

      <ChatSidebarFooter currentUser={currentUser} />

      <NewChatModal 
        open={showNewChatModal}
        onOpenChange={setShowNewChatModal}
      />
    </div>
  );
};
