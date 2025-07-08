
import { User, Team, Chat } from '@/types/chat';

export const mockUsers: User[] = [
  { id: '1', name: 'Ana Lúcia', email: 'ana@empresa.com', role: 'admin', isOnline: true },
  { id: '2', name: 'João Pedro', email: 'joao@empresa.com', role: 'user', isOnline: true },
  { id: '3', name: 'Maria Souza', email: 'maria@empresa.com', role: 'leader', isOnline: false },
  { id: '4', name: 'Carlos Silva', email: 'carlos@empresa.com', role: 'user', isOnline: true },
];

export const mockTeams: Team[] = [
  {
    id: 'comercial',
    name: 'Comercial',
    description: 'Equipe de vendas e relacionamento',
    icon: '💼',
    members: mockUsers.filter(u => ['1', '2'].includes(u.id))
  },
  {
    id: 'suporte',
    name: 'Suporte',
    description: 'Atendimento e suporte técnico',
    icon: '🛠️',
    members: mockUsers.filter(u => ['1', '3', '4'].includes(u.id))
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    description: 'Gestão e administração',
    icon: '🗂️',
    members: mockUsers.filter(u => ['1', '3'].includes(u.id))
  }
];

export const mockChats: Chat[] = [
  {
    id: 'general',
    type: 'general',
    name: 'Geral',
    participants: mockUsers,
    messages: [
      {
        id: '1',
        senderId: '4',
        senderName: 'Carlos Silva',
        content: 'Bom dia pessoal! Como estão as vendas hoje?',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text'
      },
      {
        id: '2',
        senderId: '1',
        senderName: 'Ana Lúcia',
        content: 'Bom dia Carlos! As vendas estão indo bem, batemos 80% da meta.',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text'
      }
    ],
    unreadCount: 0
  },
  {
    id: 'team-comercial',
    type: 'team',
    name: 'Comercial',
    participants: mockUsers.filter(u => ['1', '2'].includes(u.id)),
    messages: [
      {
        id: '3',
        senderId: '2',
        senderName: 'João Pedro',
        content: 'Ana, você viu o relatório do cliente X?',
        timestamp: new Date(Date.now() - 900000),
        type: 'text'
      }
    ],
    unreadCount: 1,
    teamId: 'comercial'
  }
];
