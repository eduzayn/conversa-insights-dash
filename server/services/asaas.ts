import axios, { AxiosInstance } from 'axios';

export interface AsaasConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
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
  country?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type?: 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  postalService?: boolean;
  notificationEnabled?: boolean;
  callback?: {
    successUrl?: string;
    autoRedirect?: boolean;
  };
}

export interface AsaasWebhookEvent {
  event: string;
  payment: {
    object: string;
    id: string;
    dateCreated: string;
    customer: string;
    paymentLink?: string;
    value: number;
    netValue: number;
    originalValue?: number;
    interestValue?: number;
    description?: string;
    billingType: string;
    status: string;
    pixTransaction?: string;
    confirmedDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    installmentNumber?: number;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    transactionReceiptUrl?: string;
    invoiceNumber?: string;
    externalReference?: string;
    dueDate: string;
    originalDueDate: string;
  };
}

const ASAAS_CONFIG: AsaasConfig = {
  baseURL: 'https://api.asaas.com/v3',
  apiKey: process.env.ASAAS_API_KEY || '',
  timeout: 30000,
  retryAttempts: 3
};

export class AsaasService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ASAAS_CONFIG.baseURL,
      timeout: ASAAS_CONFIG.timeout,
      headers: {
        'access_token': ASAAS_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Sistema-CRM-Educacional/1.0'
      }
    });

    // Interceptor para retry automático
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < ASAAS_CONFIG.retryAttempts && 
            (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
          config.retry += 1;
          await new Promise(resolve => setTimeout(resolve, 1000 * config.retry));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.get('/customers?limit=1');
      return {
        success: true,
        message: `Conexão bem-sucedida. API Asaas funcionando. Status: ${response.status}`
      };
    } catch (error: any) {
      console.error('Erro ao testar conexão com Asaas:', error.response?.data || error.message);
      return {
        success: false,
        message: `Falha na conexão: ${error.response?.data?.errors?.[0]?.description || error.message}`
      };
    }
  }

  async validateConfiguration(): Promise<{ valid: boolean; message: string }> {
    if (!ASAAS_CONFIG.apiKey) {
      return {
        valid: false,
        message: 'ASAAS_API_KEY não configurada no ambiente'
      };
    }

    if (!ASAAS_CONFIG.apiKey.startsWith('$aact_')) {
      return {
        valid: false,
        message: 'Formato de API Key inválido. Deve começar com $aact_'
      };
    }

    const connectionTest = await this.testConnection();
    return {
      valid: connectionTest.success,
      message: connectionTest.message
    };
  }

  async createCustomer(customerData: AsaasCustomer): Promise<any> {
    try {
      const response = await this.client.post('/customers', customerData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error.response?.data || error.message);
      throw new Error(`Falha ao criar cliente: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<any> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar cliente: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async listCustomers(filters: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await this.client.get(`/customers?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao listar clientes:', error.response?.data || error.message);
      throw new Error(`Falha ao listar clientes: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async createPayment(paymentData: AsaasPayment): Promise<any> {
    try {
      const response = await this.client.post('/payments', paymentData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar cobrança:', error.response?.data || error.message);
      throw new Error(`Falha ao criar cobrança: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar cobrança:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar cobrança: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async listPayments(filters: {
    customer?: string;
    status?: string;
    dateCreatedGe?: string;
    dateCreatedLe?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await this.client.get(`/payments?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao listar cobranças:', error.response?.data || error.message);
      throw new Error(`Falha ao listar cobranças: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async syncPaymentStatus(paymentId: string): Promise<any> {
    try {
      const paymentData = await this.getPayment(paymentId);
      return {
        id: paymentData.id,
        status: paymentData.status,
        value: paymentData.value,
        paidAt: paymentData.confirmedDate || paymentData.paymentDate,
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        pixTransaction: paymentData.pixTransaction
      };
    } catch (error: any) {
      console.error('Erro ao sincronizar status:', error.response?.data || error.message);
      throw new Error(`Falha ao sincronizar status: ${error.message}`);
    }
  }

  async importAllPayments(): Promise<{ imported: number; errors: string[]; payments: any[] }> {
    try {
      const result = { imported: 0, errors: [] as string[], payments: [] as any[] };
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await this.listPayments({ limit, offset });
          const payments = response.data || [];
          
          if (payments.length === 0) {
            hasMore = false;
            break;
          }

          for (const payment of payments) {
            try {
              // Mapear dados do Asaas para formato interno
              const mappedPayment = {
                id: payment.id,
                customer: payment.customer,
                description: payment.description,
                value: payment.value,
                dueDate: payment.dueDate,
                status: payment.status,
                billingType: payment.billingType,
                invoiceUrl: payment.invoiceUrl,
                dateCreated: payment.dateCreated,
                paymentDate: payment.paymentDate,
                originalValue: payment.originalValue,
                interestValue: payment.interestValue,
                fineValue: payment.fineValue,
                netValue: payment.netValue,
                bankSlipUrl: payment.bankSlipUrl,
                pixTransaction: payment.pixTransaction
              };
              
              result.payments.push(mappedPayment);
              result.imported++;
            } catch (error: any) {
              result.errors.push(`Erro ao processar pagamento ${payment.id}: ${error.message}`);
            }
          }

          offset += limit;
          hasMore = payments.length === limit;
          
          // Delay para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error: any) {
          result.errors.push(`Erro na página offset ${offset}: ${error.message}`);
          break;
        }
      }

      return result;
    } catch (error: any) {
      console.error('Erro na importação:', error);
      throw new Error(`Falha na importação: ${error.message}`);
    }
  }

  async getAllPayments(filters: {
    customer?: string;
    status?: string;
    dateCreatedGe?: string;
    dateCreatedLe?: string;
  } = {}): Promise<any[]> {
    try {
      const allPayments: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await this.listPayments({ ...filters, limit, offset });
        const payments = response.data || [];
        
        if (payments.length === 0) {
          hasMore = false;
          break;
        }

        allPayments.push(...payments);
        offset += limit;
        hasMore = payments.length === limit;
        
        // Delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return allPayments;
    } catch (error: any) {
      console.error('Erro ao buscar todas as cobranças:', error);
      throw new Error(`Falha ao buscar cobranças: ${error.message}`);
    }
  }

  async getAllPaymentsWithCustomers(filters: {
    customer?: string;
    status?: string;
    dateCreatedGe?: string;
    dateCreatedLe?: string;
  } = {}): Promise<any[]> {
    try {
      const allPayments = await this.getAllPayments(filters);
      const paymentsWithCustomers: any[] = [];
      
      // Cache para evitar buscar o mesmo cliente múltiplas vezes
      const customerCache = new Map<string, any>();

      for (const payment of allPayments) {
        try {
          let customerData = null;
          
          if (payment.customer && payment.customer.startsWith('cus_')) {
            // Buscar dados do cliente se não estiver no cache
            if (!customerCache.has(payment.customer)) {
              try {
                customerData = await this.getCustomer(payment.customer);
                customerCache.set(payment.customer, customerData);
              } catch (error) {
                console.warn(`Erro ao buscar cliente ${payment.customer}:`, error);
                customerCache.set(payment.customer, null);
              }
            } else {
              customerData = customerCache.get(payment.customer);
            }
          }

          paymentsWithCustomers.push({
            ...payment,
            customerData: customerData ? {
              name: customerData.name,
              email: customerData.email,
              cpfCnpj: customerData.cpfCnpj,
              phone: customerData.phone,
              mobilePhone: customerData.mobilePhone
            } : null
          });

          // Delay menor para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`Erro ao processar pagamento ${payment.id}:`, error);
          // Adicionar pagamento mesmo sem dados do cliente
          paymentsWithCustomers.push({
            ...payment,
            customerData: null
          });
        }
      }

      return paymentsWithCustomers;
    } catch (error: any) {
      console.error('Erro ao buscar cobranças com clientes:', error);
      throw new Error(`Falha ao buscar cobranças com dados de clientes: ${error.message}`);
    }
  }

  async syncAllPayments(): Promise<{ synced: number; errors: string[] }> {
    try {
      const result = { synced: 0, errors: [] as string[] };
      
      // Aqui você buscaria os pagamentos do seu banco de dados
      // e sincronizaria com o status no Asaas
      
      return result;
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      throw new Error(`Falha na sincronização: ${error.message}`);
    }
  }

  processWebhookEvent(event: AsaasWebhookEvent): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Processando webhook Asaas:', event);
      
      // Aqui você processaria o evento do webhook
      // Por exemplo, atualizando o status do pagamento no banco
      
      return Promise.resolve({
        success: true,
        message: `Evento ${event.event} processado com sucesso para pagamento ${event.payment.id}`
      });
    } catch (error: any) {
      console.error('Erro ao processar webhook:', error);
      return Promise.resolve({
        success: false,
        message: `Falha ao processar webhook: ${error.message}`
      });
    }
  }

  mapAsaasStatusToInternal(asaasStatus: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'RECEIVED': 'received',
      'CONFIRMED': 'confirmed',
      'OVERDUE': 'overdue',
      'REFUNDED': 'refunded',
      'RECEIVED_IN_CASH': 'received',
      'REFUND_REQUESTED': 'refunded'
    };

    return statusMap[asaasStatus] || 'pending';
  }
}

export const asaasService = new AsaasService();