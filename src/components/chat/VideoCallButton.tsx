
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { VideoCallModal } from './VideoCallModal';
import { Chat, User } from '@/types/chat';
import { useChatContext } from '@/contexts/ChatContext';

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

  const generateJitsiUrl = () => {
    const prefix = 'zayn';
    let room = '';

    if (chat.type === 'general') {
      room = `${prefix}-geral`;
    } else if (chat.type === 'team' && teamName) {
      const equipeName = teamName.toLowerCase().replace(/\s+/g, '-');
      room = `${prefix}-equipe-${equipeName}`;
    } else if (chat.type === 'private') {
      const participantNames = chat.participants.map(p => p.name.toLowerCase().replace(/\s+/g, '-')).sort();
      room = `${prefix}-privado-${participantNames.join('-')}`;
    }

    return `https://meet.jit.si/${room}`;
  };

  const jitsiUrl = generateJitsiUrl();
  const roomName = jitsiUrl.split('/').pop() || 'zayn-sala';

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

  const getConversationType = (): 'geral' | 'equipe' | 'privada' => {
    switch (chat.type) {
      case 'general':
        return 'geral';
      case 'team':
        return 'equipe';
      case 'private':
        return 'privada';
      default:
        return 'privada';
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
        conversationType={getConversationType()}
      />
    </>
  );
};
