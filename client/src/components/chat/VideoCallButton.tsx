
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat, User } from "@/types/chat";

interface VideoCallButtonProps {
  chat: Chat;
  currentUser: User | null;
  onStartCall: () => void;
}

export const VideoCallButton = ({ chat, currentUser, onStartCall }: VideoCallButtonProps) => {
  if (!currentUser) return null;

  const handleStartCall = () => {
    // Iniciando chamada de vídeo
    onStartCall();
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleStartCall}
      title="Iniciar Chamada de Vídeo"
      className="text-green-600 hover:text-green-700 hover:bg-green-50"
    >
      <Video className="h-4 w-4" />
    </Button>
  );
};
