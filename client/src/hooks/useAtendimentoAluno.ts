import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Conversation, AtendimentoFilters, AtendimentoMessage, Attendant, InternalNote } from '@/types/atendimento-aluno';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

// Mock data para desenvolvimento - agora com atendentes disponíveis
const mockAttendants: Attendant[] = [
  { id: 'att1', name: 'Ana Santos', isOnline: true, role: 'atendente' },
  { id: 'att2', name: 'Carlos Lima', isOnline: true, role: 'supervisor' },
  { id: 'att3', name: 'Bruna Reis', isOnline: false, role: 'atendente' },
  { id: 'att4', name: 'Pedro Silva', isOnline: true, role: 'admin' }
];

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
    updatedAt: new Date('2024-01-08T14:30:00'),
    internalNotes: [],
    hasNewMessage: true
  },
  {
    id: '2',
    student: {
      id: 'student2',
      name: 'Maria Souza',
      email: 'maria@email.com',
      course: 'Biologia'
    },
    attendant: mockAttendants[0],
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
    updatedAt: new Date('2024-01-08T13:20:00'),
    internalNotes: [
      {
        id: 'note1',
        content: 'Aluna relatou problema recorrente com acesso. Verificar credenciais.',
        authorId: 'att1',
        authorName: 'Ana Santos',
        timestamp: new Date('2024-01-08T13:25:00')
      }
    ]
  },
  {
    id: '3',
    student: {
      id: 'student3',
      name: 'Pedro Lemos',
      email: 'pedro@email.com',
      course: 'História'
    },
    attendant: mockAttendants[1],
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
    updatedAt: new Date('2024-01-08T12:00:00'),
    internalNotes: []
  }
];

export const useAtendimentoAluno = (filters: AtendimentoFilters) => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [conversationPage, setConversationPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  // Estados para mensagens
  const [messagePages, setMessagePages] = useState<{ [conversationId: string]: number }>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<{ [conversationId: string]: boolean }>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState<{ [conversationId: string]: boolean }>({});
  
  const { notifyNewMessage } = useNotifications();
  const queryClient = useQueryClient();

  // Simular chegada de novas mensagens para demonstrar notificações
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular nova mensagem ocasionalmente (apenas para demo)
      if (Math.random() > 0.95) {
        const randomConvId = Math.random() > 0.5 ? '1' : '2';
        const studentName = randomConvId === '1' ? 'João Silva' : 'Maria Souza';
        
        notifyNewMessage(
          studentName,
          'Nova mensagem de teste recebida',
          () => window.focus()
        );
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [notifyNewMessage]);

  // Filtrar conversas baseado nos filtros
  const filteredConversations = conversations.filter(conv => {
    if (filters.curso && conv.student.course !== filters.curso) return false;
    if (filters.status && conv.status !== filters.status) return false;
    if (filters.atendente && conv.attendant?.name !== filters.atendente) return false;
    return true;
  });

  // Carregar mais conversas
  const loadMoreConversations = useCallback(async () => {
    if (isLoadingConversations || !hasMoreConversations) return;
    
    setIsLoadingConversations(true);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Em uma implementação real, aqui faria a chamada para a API
    // Por agora, vamos simular que não há mais conversas após a primeira página
    setHasMoreConversations(false);
    setConversationPage(prev => prev + 1);
    setIsLoadingConversations(false);
  }, [isLoadingConversations, hasMoreConversations]);

  // Carregar mais mensagens de uma conversa específica
  const loadMoreMessages = useCallback(async (conversationId: string) => {
    if (isLoadingMessages[conversationId] || !hasMoreMessages[conversationId]) return;
    
    setIsLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Em uma implementação real, aqui faria a chamada para a API para carregar mensagens mais antigas
    // Por agora, vamos simular que não há mais mensagens
    setHasMoreMessages(prev => ({ ...prev, [conversationId]: false }));
    setMessagePages(prev => ({ ...prev, [conversationId]: (prev[conversationId] || 1) + 1 }));
    setIsLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
  }, [isLoadingMessages, hasMoreMessages]);

  // Inicializar estados para novas conversas
  const initializeConversationPagination = useCallback((conversationId: string) => {
    if (!messagePages[conversationId]) {
      setMessagePages(prev => ({ ...prev, [conversationId]: 1 }));
      setHasMoreMessages(prev => ({ ...prev, [conversationId]: true }));
      setIsLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, [messagePages]);

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
          updatedAt: new Date(),
          hasNewMessage: false
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

  const transferConversation = useCallback(async (
    conversationId: string, 
    fromAttendantId: string, 
    toAttendantId: string, 
    reason?: string
  ) => {
    const toAttendant = mockAttendants.find(att => att.id === toAttendantId);
    const fromAttendant = mockAttendants.find(att => att.id === fromAttendantId);
    
    if (!toAttendant || !fromAttendant) return;

    // Criar mensagem do sistema
    const systemMessage: AtendimentoMessage = {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'Sistema',
      senderType: 'system',
      content: `🔄 Atendimento transferido de ${fromAttendant.name} para ${toAttendant.name}${reason ? ` - Motivo: ${reason}` : ''}`,
      timestamp: new Date(),
      type: 'system',
      read: true
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          attendant: toAttendant,
          messages: [...conv.messages, systemMessage],
          lastMessage: systemMessage,
          updatedAt: new Date()
        };
      }
      return conv;
    }));

    toast.success(`Atendimento transferido para ${toAttendant.name}`);
  }, []);

  const saveInternalNote = useCallback(async (conversationId: string, content: string, currentUser: any) => {
    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          internalNotes: [...conv.internalNotes, newNote],
          updatedAt: new Date()
        };
      }
      return conv;
    }));

    toast.success('Nota interna salva com sucesso!');
  }, []);

  return {
    conversations: filteredConversations,
    availableAttendants: mockAttendants,
    isLoading: false,
    
    // Paginação de conversas
    hasMoreConversations,
    isLoadingConversations,
    loadMoreConversations,
    
    // Paginação de mensagens
    hasMoreMessages,
    isLoadingMessages,
    loadMoreMessages,
    initializeConversationPagination,
    
    // Funções existentes
    sendMessage,
    updateStatus,
    transferConversation,
    saveInternalNote
  };
};
