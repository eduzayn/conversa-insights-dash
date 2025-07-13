
export interface Atendimento {
  id: number;
  lead: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
  resultado?: 'venda_ganha' | 'venda_perdida' | 'aluno_satisfeito' | 'sem_solucao' | 'resolvido';
}

export interface AtendimentosFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  equipe?: string;
  search?: string;
  periodo?: string;
  atendente?: string;
}

export interface AtendimentoData {
  id: string;
  lead: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
}
