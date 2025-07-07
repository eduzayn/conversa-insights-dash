
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { VoiceCallModal } from './VoiceCallModal';
import { Chat, User } from '@/types/chat';
import { useChatContext } from '@/contexts/ChatContext';
import { generateJitsiRoomName, getConversationType, getParticipantNames } from '@/utils/jitsiUtils';

interface VoiceCallButtonProps {
  chat: Chat;
  currentUser: User | null;
  teamName?: string;
}

export const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ 
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

  const jitsiUrl = `${generateJitsiRoomName(
    conversationType,
    participantNames,
    teamName
  )}#config.startWithVideoMuted=true&config.startWithAudioMuted=false`;

  const handleStartCall = () => {
    setShowModal(true);
    
    // Enviar mensagem automática no chat
    if (currentUser) {
      addMessage(chat.id, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: `🔊 ${currentUser.name} iniciou uma chamada de voz. Clique no link para entrar na sala: ${jitsiUrl}`,
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
        title="Iniciar chamada de voz"
      >
        <Phone className="h-4 w-4" />
      </Button>

      <VoiceCallModal
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
