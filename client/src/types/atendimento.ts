
export interface Atendimento {
  id: number;
  lead: string;
  data: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
  resultado?: 'venda_ganha' | 'venda_perdida' | 'aluno_satisfeito' | 'sem_solucao' | 'resolvido';
  assunto?: string;
  observacoes?: string;
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
  data: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
  assunto?: string;
  observacoes?: string;
}
