
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat, User } from "@/types/chat";

interface AudioCallButtonProps {
  chat: Chat;
  currentUser: User | null;
  onStartCall: () => void;
}

export const AudioCallButton = ({ chat, currentUser, onStartCall }: AudioCallButtonProps) => {
  if (!currentUser) return null;

  const handleStartCall = () => {
    // Iniciando chamada de áudio
    onStartCall();
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleStartCall}
      title="Iniciar Chamada de Áudio"
      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    >
      <Phone className="h-4 w-4" />
    </Button>
  );
};
