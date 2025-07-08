
export interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  avatar?: string;
}

export interface Attendant {
  id: string;
  name: string;
  isOnline?: boolean;
  role?: 'atendente' | 'supervisor' | 'admin';
}

export interface AtendimentoMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'student' | 'attendant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'audio' | 'system';
  fileUrl?: string;
  fileName?: string;
  read: boolean;
}

export interface InternalNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  student: Student;
  attendant?: Attendant;
  status: 'novo' | 'em_andamento' | 'finalizado';
  messages: AtendimentoMessage[];
  lastMessage?: AtendimentoMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  internalNotes: InternalNote[];
  hasNewMessage?: boolean;
}

export interface AtendimentoFilters {
  curso?: string;
  status?: string;
  atendente?: string;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  soundType: 'ping' | 'pop' | 'bell' | 'tap';
  browserNotifications: boolean;
}

export interface TransferData {
  fromAttendantId: string;
  toAttendantId: string;
  reason?: string;
}
