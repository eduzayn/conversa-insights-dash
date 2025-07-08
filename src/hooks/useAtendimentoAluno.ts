
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Conversation, AtendimentoFilters, AtendimentoMessage } from '@/types/atendimento-aluno';
import { toast } from 'sonner';

// Mock data para desenvolvimento
const mockConversations: Conversation[] = [
  {
    id: '1',
    student: {
      id: 'student1',
      name: 'João Silva',
      email: 'joao@email.com',
      course: 'Matemática'
    },
    status: 'novo',
    messages: [
      {
        id: 'msg1',
        senderId: 'student1',
        senderName: 'João Silva',
        senderType: 'student',
        content: 'Tenho dúvida na atividade 3 de cálculo. Podem me ajudar?',
        timestamp: new Date('2024-01-08T14:30:00'),
        type: 'text',
        read: false
      }
    ],
    unreadCount: 1,
    createdAt: new Date('2024-01-08T14:30:00'),
    updatedAt: new Date('2024-01-08T14:30:00')
  },
  {
    id: '2',
    student: {
      id: 'student2',
      name: 'Maria Souza',
      email: 'maria@email.com',
      course: 'Biologia'
    },
    attendant: {
      id: 'att1',
      name: 'Ana Santos'
    },
    status: 'em_andamento',
    messages: [
      {
        id: 'msg2',
        senderId: 'student2',
        senderName: 'Maria Souza',
        senderType: 'student',
        content: 'Não consigo acessar o material da aula de hoje',
        timestamp: new Date('2024-01-08T13:15:00'),
        type: 'text',
        read: true
      },
      {
        id: 'msg3',
        senderId: 'att1',
        senderName: 'Ana Santos',
        senderType: 'attendant',
        content: 'Olá Maria! Vou verificar o problema para você.',
        timestamp: new Date('2024-01-08T13:20:00'),
        type: 'text',
        read: true
      }
    ],
    unreadCount: 0,
    createdAt: new Date('2024-01-08T13:15:00'),
    updatedAt: new Date('2024-01-08T13:20:00')
  },
  {
    id: '3',
    student: {
      id: 'student3',
      name: 'Pedro Lemos',
      email: 'pedro@email.com',
      course: 'História'
    },
    attendant: {
      id: 'att2',
      name: 'Carlos Lima'
    },
    status: 'finalizado',
    messages: [
      {
        id: 'msg4',
        senderId: 'student3',
        senderName: 'Pedro Lemos',
        senderType: 'student',
        content: 'Obrigado pela ajuda com o trabalho!',
        timestamp: new Date('2024-01-08T12:00:00'),
        type: 'text',
        read: true
      }
    ],
    unreadCount: 0,
    createdAt: new Date('2024-01-08T10:00:00'),
    updatedAt: new Date('2024-01-08T12:00:00')
  }
];

export const useAtendimentoAluno = (filters: AtendimentoFilters) => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const queryClient = useQueryClient();

  // Filtrar conversas baseado nos filtros
  const filteredConversations = conversations.filter(conv => {
    if (filters.curso && conv.student.course !== filters.curso) return false;
    if (filters.status && conv.status !== filters.status) return false;
    if (filters.atendente && conv.attendant?.name !== filters.atendente) return false;
    return true;
  });

  const sendMessage = useCallback(async (conversationId: string, content: string, currentUser: any) => {
    const newMessage: AtendimentoMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType: 'attendant',
      content,
      timestamp: new Date(),
      type: 'text',
      read: true
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: newMessage,
          status: conv.status === 'novo' ? 'em_andamento' : conv.status,
          attendant: conv.attendant || { id: currentUser.id, name: currentUser.name },
          updatedAt: new Date()
        };
      }
      return conv;
    }));

    toast.success('Mensagem enviada com sucesso!');
  }, []);

  const updateStatus = useCallback(async (conversationId: string, status: Conversation['status']) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          status,
          updatedAt: new Date()
        };
      }
      return conv;
    }));

    toast.success('Status atualizado com sucesso!');
  }, []);

  return {
    conversations: filteredConversations,
    isLoading: false,
    sendMessage,
    updateStatus
  };
};
