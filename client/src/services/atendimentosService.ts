
import { Atendimento } from '@/types/atendimento';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const atendimentosService = {
  async getAtendimentos(filters?: any, page: number = 1, limit: number = 20): Promise<{
    data: Atendimento[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
      hasNext: boolean,
      hasPrev: boolean
    }
  }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.equipe) params.append('equipe', filters.equipe);
    if (filters?.atendente) params.append('atendente', filters.atendente);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.companhia) params.append('companhia', filters.companhia);
    
    // Parâmetros de paginação
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/atendimentos?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar atendimentos: ${response.status}`);
    }
    
    return await response.json();
  },

  async updateAtendimento(id: number, data: Partial<Atendimento>): Promise<Atendimento> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/atendimentos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar atendimento: ${response.status}`);
    }
    
    return await response.json();
  },

  async updateStatus(id: string | number, status: Atendimento['status']): Promise<Atendimento> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/atendimentos/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status: ${response.status}`);
    }
    
    return await response.json();
  },

  async updateResultado(id: string | number, resultado: Atendimento['resultado']): Promise<Atendimento> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/atendimentos/${id}/resultado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ resultado }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar resultado: ${response.status}`);
    }
    
    return await response.json();
  },

  async syncConversations(): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/atendimentos/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao sincronizar conversas: ${response.status}`);
    }
  }
};

// Export types for use in other files
export type { Atendimento as AtendimentoData } from '@/types/atendimento';
export type { AtendimentosFilters } from '@/types/atendimento';
