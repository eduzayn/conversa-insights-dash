
export interface Atendimento {
  id: number;
  lead: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
  resultado?: 'venda_ganha' | 'venda_perdida' | 'aluno_satisfeito' | 'sem_solucao';
  companhia?: string; // COMERCIAL ou SUPORTE
}

export interface AtendimentosFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  equipe?: string;
  search?: string;
  periodo?: string;
  atendente?: string;
  companhia?: string; // COMERCIAL, SUPORTE, ou Todas
}

export interface AtendimentoData {
  id: string;
  lead: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
  companhia?: string; // COMERCIAL ou SUPORTE
}
