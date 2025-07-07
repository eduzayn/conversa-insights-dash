
import { Chat, User } from '@/types/chat';

export const createPrivateChat = (userId: string, users: User[], currentUser: User | null, chats: Chat[]): Chat => {
  const targetUser = users.find(u => u.id === userId);
  if (!targetUser || !currentUser) throw new Error('User not found');

  const existingChat = chats.find(
    chat => chat.type === 'private' && 
    chat.participants.some(p => p.id === userId) &&
    chat.participants.some(p => p.id === currentUser.id)
  );

  if (existingChat) return existingChat;

  const newChat: Chat = {
    id: `private-${currentUser.id}-${userId}`,
    type: 'private',
    name: targetUser.name,
    participants: [currentUser, targetUser],
    messages: [],
    unreadCount: 0
  };

  return newChat;
};

export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Erro ao reproduzir som de notificação:', error);
  }
};
