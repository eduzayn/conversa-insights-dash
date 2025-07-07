
import { Globe, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/types/chat";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chat: Chat) => void;
}

export const ChatItem = ({ chat, isActive, onSelect }: ChatItemProps) => {
  const { teams } = useChatContext();
  const team = chat.teamId ? teams.find(t => t.id === chat.teamId) : null;

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

  return (
    <div
      onClick={() => onSelect(chat)}
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
