
import { User } from "@/types/chat";

interface MentionSuggestionsProps {
  users: User[];
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (user: User) => void;
  position: { top: number; left: number };
}

export const MentionSuggestions = ({ 
  users, 
  isVisible, 
  selectedIndex, 
  onSelect,
  position 
}: MentionSuggestionsProps) => {
  if (!isVisible || users.length === 0) return null;

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        minWidth: '200px'
      }}
    >
      {users.map((user, index) => (
        <div
          key={user.id}
          onClick={() => onSelect(user)}
          className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
            index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
          }`}
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {user.name.charAt(0)}
          </div>
          <span className="text-sm">{user.name}</span>
          {user.isOnline && (
            <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
          )}
        </div>
      ))}
    </div>
  );
};
