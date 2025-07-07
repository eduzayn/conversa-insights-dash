
import { User } from "@/pages/ChatInterno";
import { cn } from "@/lib/utils";

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
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-48"
      style={{ top: position.top, left: position.left }}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={cn(
            "w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2",
            index === selectedIndex && "bg-blue-50 text-blue-600"
          )}
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
};
