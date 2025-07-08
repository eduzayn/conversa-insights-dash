
import { Atendimento } from '@/types/atendimento';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const atendimentosService = {
  async getAtendimentos(filters?: any): Promise<Atendimento[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.equipe) params.append('equipe', filters.equipe);

      const response = await fetch(`${API_URL}/atendimentos?${params}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar atendimentos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de atendimentos:', error);
      // Retorna dados mockados em caso de erro
      return [
        {
          id: 1,
          lead: "Maria Silva",
          hora: "09:15",
          atendente: "Ana Santos",
          equipe: "Vendas",
          duracao: "15m",
          status: "Concluído"
        },
        {
          id: 2,
          lead: "João Santos",
          hora: "10:30",
          atendente: "Carlos Lima",
          equipe: "Suporte",
          duracao: "8m",
          status: "Em andamento"
        },
        {
          id: 3,
          lead: "Ana Costa",
          hora: "11:45",
          atendente: "Bruna Reis",
          equipe: "Vendas",
          duracao: "22m",
          status: "Pendente"
        }
      ];
    }
  },

  async updateAtendimento(id: number, data: Partial<Atendimento>): Promise<Atendimento> {
    try {
      const response = await fetch(`${API_URL}/atendimentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar atendimento');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar atendimento:', error);
      throw error;
    }
  }
};
