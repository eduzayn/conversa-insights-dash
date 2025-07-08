
export interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  avatar?: string;
}

export interface AtendimentoMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'student' | 'attendant';
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'audio';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  student: Student;
  attendant?: {
    id: string;
    name: string;
  };
  status: 'novo' | 'em_andamento' | 'finalizado';
  messages: AtendimentoMessage[];
  lastMessage?: AtendimentoMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AtendimentoFilters {
  curso?: string;
  status?: string;
  atendente?: string;
}
