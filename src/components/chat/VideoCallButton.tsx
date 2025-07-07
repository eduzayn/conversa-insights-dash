
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { VideoCallModal } from './VideoCallModal';
import { Chat, User } from '@/types/chat';
import { useChatContext } from '@/contexts/ChatContext';
import { generateJitsiRoomName, getConversationType, getParticipantNames } from '@/utils/jitsiUtils';

interface VideoCallButtonProps {
  chat: Chat;
  currentUser: User | null;
  teamName?: string;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({ 
  chat, 
  currentUser, 
  teamName 
}) => {
  const [showModal, setShowModal] = useState(false);
  const { addMessage } = useChatContext();

  const conversationType = getConversationType(chat);
  const participantNames = getParticipantNames(chat, currentUser);
  
  const roomName = (() => {
    if (conversationType === 'geral') return 'zayn-geral';
    if (conversationType === 'equipe' && teamName) return `zayn-equipe-${teamName.toLowerCase().replace(/\s+/g, '-')}`;
    if (conversationType === 'privada') {
      const sorted = participantNames.map(p => p.toLowerCase().replace(/\s+/g, '-')).sort();
      return `zayn-privado-${sorted.join('-')}`;
    }
    return 'zayn-sala';
  })();

  const jitsiUrl = generateJitsiRoomName(
    conversationType,
    participantNames,
    teamName
  );

  const handleStartCall = () => {
    setShowModal(true);
    
    // Enviar mensagem automática no chat
    if (currentUser) {
      addMessage(chat.id, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: `📹 ${currentUser.name} iniciou uma chamada de vídeo.`,
        type: 'text'
      });
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartCall}
        title="Iniciar chamada de vídeo"
      >
        <Video className="h-4 w-4" />
      </Button>

      <VideoCallModal
        open={showModal}
        onOpenChange={setShowModal}
        roomName={roomName}
        jitsiUrl={jitsiUrl}
        chatName={chat.name}
        conversationType={conversationType}
      />
    </>
  );
};
