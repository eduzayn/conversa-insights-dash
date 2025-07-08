
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  course: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  companyAccount?: 'COMERCIAL' | 'SUPORTE';
  createdAt: Date;
  updatedAt: Date;
  lastInteraction?: Date;
  conversationId?: string;
  notes?: string;
  source?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
  leads: Lead[];
}

export interface CrmFunnel {
  id: string;
  name: string;
  team: string;
  columns: KanbanColumn[];
  isActive: boolean;
}

export interface CrmFilters {
  team?: string;
  assignedTo?: string;
  course?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  companyAccount?: 'COMERCIAL' | 'SUPORTE';
}

export interface MoveLeadData {
  leadId: string;
  fromColumnId: string;
  toColumnId: string;
  newIndex: number;
}

export interface CrmTeam {
  id: string;
  name: string;
  description?: string;
  company?: 'COMERCIAL' | 'SUPORTE';
  isActive: boolean;
  createdAt: Date;
}

export type CrmViewMode = 'kanban' | 'list';
