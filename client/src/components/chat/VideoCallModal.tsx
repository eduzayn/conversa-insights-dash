
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from "lucide-react";
import { VideoCallRoom } from "./VideoCallRoom";
import { Chat, User } from "@/types/chat";

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
  currentUser: User | null;
}

export const VideoCallModal = ({ open, onOpenChange, chat, currentUser }: VideoCallModalProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    if (open && chat && currentUser) {
      // Gerar nome único do canal baseado no chat e timestamp
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
      const chatPrefix = chat.type === 'private' ? 'pvt' : chat.type === 'team' ? 'team' : 'general';
      const newChannelName = `${chatPrefix}-${chat.id}-${timestamp}`;
      setChannelName(newChannelName);
      
      // Canal de vídeo criado
    }
  }, [open, chat, currentUser]);

  const handleJoinCall = () => {
    // Entrando na chamada
    setIsCallActive(true);
  };

  const handleLeaveCall = () => {
    // Saindo da chamada
    setIsCallActive(false);
    onOpenChange(false);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // Toggle vídeo
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // Toggle áudio
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            Chamada de Vídeo - {chat.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          {!isCallActive ? (
            // Tela de pré-chamada
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Pronto para iniciar a chamada?
                </h3>
                <p className="text-gray-600 mb-4">
                  {chat.participants.length} participante(s) podem entrar nesta chamada
                </p>
                <p className="text-sm text-gray-500">
                  Canal: {channelName}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant={isVideoEnabled ? "default" : "outline"}
                  size="lg"
                  onClick={toggleVideo}
                  className="w-12 h-12 rounded-full p-0"
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant={isAudioEnabled ? "default" : "outline"}
                  size="lg"
                  onClick={toggleAudio}
                  className="w-12 h-12 rounded-full p-0"
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </div>

              <Button 
                onClick={handleJoinCall}
                className="bg-green-600 hover:bg-green-700 px-8 py-3"
                size="lg"
              >
                Entrar na Chamada
              </Button>
            </div>
          ) : (
            // Tela da chamada ativa
            <div className="flex-1 flex flex-col">
              <VideoCallRoom
                channelName={channelName}
                currentUser={currentUser}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                onToggleVideo={toggleVideo}
                onToggleAudio={toggleAudio}
                onLeaveCall={handleLeaveCall}
              />
            </div>
          )}
        </div>

        {isCallActive && (
          <div className="flex justify-center gap-4 p-4 border-t">
            <Button
              variant={isVideoEnabled ? "default" : "outline"}
              size="lg"
              onClick={toggleVideo}
              className="w-12 h-12 rounded-full p-0"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isAudioEnabled ? "default" : "outline"}  
              size="lg"
              onClick={toggleAudio}
              className="w-12 h-12 rounded-full p-0"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleLeaveCall}
              className="w-12 h-12 rounded-full p-0"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
