// server/services/unified-asaas-service.ts
import axios, { AxiosInstance } from 'axios';

interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  billingType: string;
  value: number;
  netValue: number;
  description: string;
  installment?: string;
  dueDate: string;
  status: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  paymentDate?: string;
}

interface AsaasResponse<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

interface SyncResult {
  syncedCount: number;
  errors: string[];
}

export class UnifiedAsaasService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.baseURL = process.env.ASAAS_ENVIRONMENT === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      }
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.get('/myAccount');
      return {
        success: true,
        message: `Conectado com sucesso. Conta: ${response.data.name}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro de conexão'
      };
    }
  }

  async getPayments(filters: any = {}): Promise<AsaasResponse<AsaasPayment>> {
    try {
      const response = await this.client.get('/payments', { params: filters });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar pagamentos:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar pagamentos');
    }
  }

  async getPayment(id: string): Promise<AsaasPayment> {
    try {
      const response = await this.client.get(`/payments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar pagamento:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar pagamento');
    }
  }

  async cancelPayment(id: string): Promise<AsaasPayment> {
    try {
      const response = await this.client.delete(`/payments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao cancelar pagamento:', error);
      throw new Error(error.response?.data?.message || 'Erro ao cancelar pagamento');
    }
  }

  async sendPaymentReminder(id: string, type: 'email' | 'sms' = 'email'): Promise<any> {
    try {
      const response = await this.client.post(`/payments/${id}/sendReminder`, {
        type
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar lembrete:', error);
      throw new Error(error.response?.data?.message || 'Erro ao enviar lembrete');
    }
  }

  async syncPayments(): Promise<SyncResult> {
    try {
      // Buscar todos os pagamentos recentes
      const response = await this.getPayments({ limit: 100 });
      
      return {
        syncedCount: response.data?.length || 0,
        errors: []
      };
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      return {
        syncedCount: 0,
        errors: [error.message]
      };
    }
  }
}