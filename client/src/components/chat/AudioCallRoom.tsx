
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone } from "lucide-react";
import { Chat, User } from "@/types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AudioCallRoomProps {
  chat: Chat;
  currentUser: User;
  onEndCall: () => void;
}

export const AudioCallRoom = ({ chat, currentUser, onEndCall }: AudioCallRoomProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simular conexão
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Microfone controlado silenciosamente
  };

  const handleEndCall = () => {
    // Encerrando chamada de áudio
    onEndCall();
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      {/* Status da chamada */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isConnected ? 'Chamada em andamento' : 'Conectando...'}
        </h3>
        {isConnected && (
          <p className="text-lg text-gray-600">{formatDuration(callDuration)}</p>
        )}
      </div>

      {/* Participantes */}
      <div className="flex flex-wrap gap-4 justify-center">
        {chat.participants.map(participant => (
          <div key={participant.id} className="flex flex-col items-center space-y-2">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {participant.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-medium text-gray-900">{participant.name}</p>
              <p className="text-sm text-gray-500">
                {participant.id === currentUser.id ? 'Você' : 
                 isConnected ? 'Conectado' : 'Conectando...'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controles da chamada */}
      <div className="flex items-center gap-4">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="lg"
          onClick={handleToggleMute}
          className="rounded-full p-4"
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        
        <Button
          variant="destructive"
          size="lg"
          onClick={handleEndCall}
          className="rounded-full p-4"
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>

      {/* Status do microfone */}
      <p className="text-sm text-gray-500">
        Microfone: {isMuted ? 'Desativado' : 'Ativado'}
      </p>
    </div>
  );
};
