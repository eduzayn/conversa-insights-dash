
import { useState } from "react";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { Chat } from "@/types/chat";
import { ChatItem } from "./ChatItem";

interface ChatSectionProps {
  title: string;
  icon: LucideIcon;
  chats: Chat[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export const ChatSection = ({ 
  title, 
  icon: Icon, 
  chats, 
  activeChat, 
  onChatSelect, 
  children,
  defaultOpen = true 
}: ChatSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mb-2 text-gray-700 hover:text-gray-900"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Icon className="h-4 w-4" />
        <span className="font-medium">{title}</span>
      </button>
      {isOpen && (
        <div className="space-y-1 ml-6">
          {chats.map(chat => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              isActive={activeChat?.id === chat.id}
              onSelect={onChatSelect}
            />
          ))}
          {children}
        </div>
      )}
    </div>
  );
};
