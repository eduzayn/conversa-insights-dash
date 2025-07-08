
import { User } from "@/types/chat";

interface ChatSidebarFooterProps {
  currentUser: User | null;
}

export const ChatSidebarFooter = ({ currentUser }: ChatSidebarFooterProps) => {
  if (!currentUser) return null;

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {currentUser.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
          <p className="text-xs text-green-600">Online</p>
        </div>
      </div>
    </div>
  );
};
