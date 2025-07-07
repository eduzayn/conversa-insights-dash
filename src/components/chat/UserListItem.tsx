
import { User } from "@/types/chat";

interface UserListItemProps {
  user: User;
  onClick: (userId: string) => void;
}

export const UserListItem = ({ user, onClick }: UserListItemProps) => {
  return (
    <div
      onClick={() => onClick(user.id)}
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
  );
};
