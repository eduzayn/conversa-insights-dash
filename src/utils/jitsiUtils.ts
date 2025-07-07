
import { Chat, User } from '@/types/chat';

export type ConversationType = 'geral' | 'equipe' | 'privada';

export const generateJitsiRoomName = (
  conversationType: ConversationType,
  participants: string[],
  teamName?: string
): string => {
  const prefix = 'zayn';
  let room = '';

  if (conversationType === 'geral') {
    room = `${prefix}-geral`;
  } else if (conversationType === 'equipe' && teamName) {
    const equipeName = teamName.toLowerCase().replace(/\s+/g, '-');
    room = `${prefix}-equipe-${equipeName}`;
  } else if (conversationType === 'privada') {
    // Ordena os nomes para que a sala seja sempre a mesma entre os dois usuários
    const sorted = participants.map(p => p.toLowerCase().replace(/\s+/g, '-')).sort();
    room = `${prefix}-privado-${sorted.join('-')}`;
  }

  return `https://meet.jit.si/${room}`;
};

export const getConversationType = (chat: Chat): ConversationType => {
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

export const getParticipantNames = (chat: Chat, currentUser: User | null): string[] => {
  if (chat.type === 'private') {
    return chat.participants.map(p => p.name);
  }
  return [];
};
