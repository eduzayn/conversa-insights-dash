import axios, { AxiosInstance } from 'axios';

interface AsaasConfig {
  baseURL: string;
  apiKey: string;
}

interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  observations?: string;
}

interface Payment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  postalService?: boolean;
}

interface PaymentFilters {
  customer?: string;
  status?: string;
  billingType?: string;
  dateCreatedGe?: string;
  dateCreatedLe?: string;
  dueDateGe?: string;
  dueDateLe?: string;
  paymentDateGe?: string;
  paymentDateLe?: string;
  offset?: number;
  limit?: number;
}

interface WebhookConfig {
  url: string;
  email: string;
  events: string[];
  authToken?: string;
}

export class UnifiedAsaasService {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;
    this.api = axios.create({
      baseURL: config.baseURL,
      headers: {
        'access_token': config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Sistema-Educacional-CRM/1.0'
      },
      timeout: 30000
    });

    // Interceptor para logs de debug
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[Asaas API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Asaas API Request Error]', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`[Asaas API Response] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[Asaas API Response Error]', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Testa a conexão com a API do Asaas
   */
  async testConnection(): Promise<{ success: boolean; message: string; accountInfo?: any }> {
    try {
      const response = await this.api.get('/myAccount');
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso',
        accountInfo: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.description || 'Erro na conexão com o Asaas'
      };
    }
  }

  /**
   * Busca informações da conta
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.api.get('/myAccount');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar informações da conta');
    }
  }

  /**
   * Cria um novo cliente
   */
  async createCustomer(customerData: Customer): Promise<any> {
    try {
      const response = await this.api.post('/customers', customerData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar cliente');
    }
  }

  /**
   * Busca um cliente por ID
   */
  async getCustomer(customerId: string): Promise<any> {
    try {
      const response = await this.api.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar cliente');
    }
  }

  /**
   * Lista clientes
   */
  async getCustomers(filters: { name?: string; email?: string; cpfCnpj?: string; offset?: number; limit?: number } = {}): Promise<any> {
    try {
      const response = await this.api.get('/customers', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao listar clientes');
    }
  }

  /**
   * Atualiza um cliente
   */
  async updateCustomer(customerId: string, customerData: Partial<Customer>): Promise<any> {
    try {
      const response = await this.api.post(`/customers/${customerId}`, customerData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao atualizar cliente');
    }
  }

  /**
   * Remove um cliente
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.api.delete(`/customers/${customerId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao remover cliente');
    }
  }

  /**
   * Cria uma nova cobrança
   */
  async createPayment(paymentData: Payment): Promise<any> {
    try {
      const response = await this.api.post('/payments', paymentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar cobrança');
    }
  }

  /**
   * Busca uma cobrança por ID
   */
  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar cobrança');
    }
  }

  /**
   * Lista cobranças com filtros
   */
  async getPayments(filters: PaymentFilters = {}): Promise<any> {
    try {
      const response = await this.api.get('/payments', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao listar cobranças');
    }
  }

  /**
   * Atualiza uma cobrança
   */
  async updatePayment(paymentId: string, paymentData: Partial<Payment>): Promise<any> {
    try {
      const response = await this.api.post(`/payments/${paymentId}`, paymentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao atualizar cobrança');
    }
  }

  /**
   * Cancela uma cobrança
   */
  async cancelPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.api.post(`/payments/${paymentId}/cancel`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao cancelar cobrança');
    }
  }

  /**
   * Remove uma cobrança
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      await this.api.delete(`/payments/${paymentId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao remover cobrança');
    }
  }

  /**
   * Estorna uma cobrança
   */
  async refundPayment(paymentId: string, value?: number, description?: string): Promise<any> {
    try {
      const data: any = {};
      if (value) data.value = value;
      if (description) data.description = description;

      const response = await this.api.post(`/payments/${paymentId}/refund`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao estornar cobrança');
    }
  }

  /**
   * Envia lembrete de cobrança
   */
  async sendPaymentReminder(paymentId: string, reminderType: 'email' | 'sms' | 'both' = 'email'): Promise<any> {
    try {
      const endpoints = {
        email: `/payments/${paymentId}/sendInvoiceByEmail`,
        sms: `/payments/${paymentId}/sendInvoiceBySms`,
        both: `/payments/${paymentId}/sendInvoice`
      };

      const response = await this.api.post(endpoints[reminderType]);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao enviar lembrete');
    }
  }

  /**
   * Gera segunda via de boleto
   */
  async generateBankSlip(paymentId: string): Promise<any> {
    try {
      const response = await this.api.get(`/payments/${paymentId}/identificationField`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao gerar segunda via');
    }
  }

  /**
   * Busca QR Code PIX
   */
  async getPixQrCode(paymentId: string): Promise<any> {
    try {
      const response = await this.api.get(`/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar QR Code PIX');
    }
  }

  /**
   * Busca a URL da fatura para pagamento (usa getPayment pois invoiceUrl vem nos detalhes)
   */
  async getPaymentInvoiceUrl(paymentId: string): Promise<any> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment.invoiceUrl) {
        throw new Error('URL da fatura não disponível para esta cobrança');
      }
      return { invoiceUrl: payment.invoiceUrl };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao buscar URL da fatura');
    }
  }

  /**
   * Sincroniza cobranças (busca todas as cobranças atualizadas)
   */
  async syncPayments(lastSyncDate?: string): Promise<{ payments: any[]; total: number; hasMore: boolean }> {
    try {
      const filters: PaymentFilters = {
        limit: 100,
        offset: 0
      };

      if (lastSyncDate) {
        filters.dateCreatedGe = lastSyncDate;
      }

      let allPayments: any[] = [];
      let hasMore = true;
      let offset = 0;

      while (hasMore) {
        filters.offset = offset;
        const response = await this.api.get('/payments', { params: filters });
        
        const payments = response.data.data || [];
        allPayments = allPayments.concat(payments);
        
        hasMore = response.data.hasMore || false;
        offset += 100;

        // Limite de segurança para evitar loops infinitos
        if (offset > 10000) {
          console.warn('[Asaas] Limite de sincronização atingido (10.000 registros)');
          break;
        }
      }

      return {
        payments: allPayments,
        total: allPayments.length,
        hasMore
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro na sincronização');
    }
  }

  /**
   * Busca estatísticas de pagamentos
   */
  async getPaymentStats(startDate?: string, endDate?: string): Promise<any> {
    try {
      const filters: PaymentFilters = {
        limit: 100,
        offset: 0
      };
      if (startDate) filters.dateCreatedGe = startDate;
      if (endDate) filters.dateCreatedLe = endDate;

      // Usar chamada direta à API para obter todos os pagamentos
      const response = await this.api.get('/payments', { params: filters });
      const payments = response.data.data || [];

      const stats = {
        total: { count: payments.length, value: 0 },
        pending: { count: 0, value: 0 },
        confirmed: { count: 0, value: 0 },
        overdue: { count: 0, value: 0 },
        cancelled: { count: 0, value: 0 },
        byBillingType: {} as Record<string, { count: number; value: number }>
      };

      payments.forEach((payment: any) => {
        const value = parseFloat(payment.value) || 0;
        stats.total.value += value;

        // Por status
        switch (payment.status) {
          case 'PENDING':
            stats.pending.count++;
            stats.pending.value += value;
            break;
          case 'CONFIRMED':
          case 'RECEIVED':
            stats.confirmed.count++;
            stats.confirmed.value += value;
            break;
          case 'OVERDUE':
            stats.overdue.count++;
            stats.overdue.value += value;
            break;
          case 'CANCELLED':
            stats.cancelled.count++;
            stats.cancelled.value += value;
            break;
        }

        // Por tipo de cobrança
        const billingType = payment.billingType || 'UNKNOWN';
        if (!stats.byBillingType[billingType]) {
          stats.byBillingType[billingType] = { count: 0, value: 0 };
        }
        stats.byBillingType[billingType].count++;
        stats.byBillingType[billingType].value += value;
      });

      return {
        ...stats,
        totalCount: response.data.totalCount || 0,
        hasMore: response.data.hasMore || false
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar estatísticas');
    }
  }

  /**
   * Configura webhook
   */
  async configureWebhook(config: WebhookConfig): Promise<any> {
    try {
      const response = await this.api.post('/webhook', config);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao configurar webhook');
    }
  }

  /**
   * Lista webhooks configurados
   */
  async getWebhooks(): Promise<any> {
    try {
      const response = await this.api.get('/webhook');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao listar webhooks');
    }
  }

  /**
   * Gera relatório financeiro
   */
  async generateFinancialReport(startDate?: string, endDate?: string): Promise<any> {
    try {
      const stats = await this.getPaymentStats(startDate, endDate);
      const payments = await this.getPayments({
        dateCreatedGe: startDate,
        dateCreatedLe: endDate,
        limit: 1000
      });

      return {
        period: {
          startDate,
          endDate
        },
        summary: stats,
        payments: payments.data || [],
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error('Erro ao gerar relatório financeiro');
    }
  }
}

// Factory function para criar instância do serviço
export const createAsaasService = (apiKey: string, sandbox: boolean = false): UnifiedAsaasService => {
  const baseURL = sandbox 
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://www.asaas.com/api/v3';

  return new UnifiedAsaasService({
    baseURL,
    apiKey
  });
};