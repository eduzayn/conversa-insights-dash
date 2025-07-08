
// Configurações da API - AJUSTE ESTES VALORES QUANDO CONECTAR COM NEON
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  endpoints: {
    atendimentos: '/atendimentos',
    botconversa: '/botconversa/webhook'
  }
};

export interface AtendimentoData {
  id: string;
  lead: string;
  hora: string;
  atendente: string;
  equipe: string;
  duracao: string;
  status: 'Concluído' | 'Em andamento' | 'Pendente';
  timestamp: Date;
  botconversaId?: string;
}

export interface AtendimentosFilters {
  periodo?: string;
  atendente?: string;
  equipe?: string;
  status?: string;
  search?: string;
}

class AtendimentosService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // Aqui você pode adicionar headers de autenticação se necessário
    const response = await fetch(`${API_CONFIG.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`, // Descomente quando necessário
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAtendimentos(filters: AtendimentosFilters = {}): Promise<AtendimentoData[]> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const url = `${API_CONFIG.endpoints.atendimentos}?${queryParams.toString()}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Erro ao buscar atendimentos:', error);
      // Retorna dados mock em caso de erro (para desenvolvimento)
      return this.getMockData();
    }
  }

  async updateStatus(id: string, status: AtendimentoData['status']): Promise<void> {
    try {
      await this.fetchWithAuth(`${API_CONFIG.endpoints.atendimentos}/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  // Webhook para receber dados da BotConversa
  async processBotConversaWebhook(data: any): Promise<void> {
    try {
      await this.fetchWithAuth(API_CONFIG.endpoints.botconversa, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Erro no webhook BotConversa:', error);
      throw error;
    }
  }

  // Dados mock para desenvolvimento
  private getMockData(): AtendimentoData[] {
    return [
      { 
        id: '1', 
        lead: "Maria Silva", 
        hora: "09:15", 
        atendente: "Ana Santos", 
        equipe: "Vendas", 
        duracao: "15m", 
        status: "Concluído",
        timestamp: new Date('2024-01-08T09:15:00'),
        botconversaId: 'bc_001'
      },
      { 
        id: '2', 
        lead: "João Costa", 
        hora: "10:30", 
        atendente: "Carlos Lima", 
        equipe: "Suporte", 
        duracao: "8m", 
        status: "Em andamento",
        timestamp: new Date('2024-01-08T10:30:00'),
        botconversaId: 'bc_002'
      },
      { 
        id: '3', 
        lead: "Ana Oliveira", 
        hora: "11:45", 
        atendente: "Bruna Reis", 
        equipe: "Comercial", 
        duracao: "22m", 
        status: "Concluído",
        timestamp: new Date('2024-01-08T11:45:00'),
        botconversaId: 'bc_003'
      },
      { 
        id: '4', 
        lead: "Pedro Santos", 
        hora: "14:20", 
        atendente: "Diego Alves", 
        equipe: "Vendas", 
        duracao: "12m", 
        status: "Pendente",
        timestamp: new Date('2024-01-08T14:20:00'),
        botconversaId: 'bc_004'
      },
    ];
  }
}

export const atendimentosService = new AtendimentosService();
