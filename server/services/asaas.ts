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
  timeout: 15000, // Reduzido para 15 segundos
  retryAttempts: 2 // Reduzido tentativas
};

export class AsaasService {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutos

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

  async createCustomer(customerData: AsaasCustomer): Promise<string> {
    try {
      const response = await this.client.post('/customers', customerData);
      return response.data.id;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error.response?.data || error.message);
      throw new Error(`Falha ao criar cliente: ${error.response?.data?.errors?.[0]?.description || error.message}`);
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

  async importAllPayments(): Promise<{ imported: number; updated: number; errors: string[] }> {
    const { storage } = await import('../storage');
    try {
      const result = { imported: 0, updated: 0, errors: [] as string[] };
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      console.log('Iniciando importação de pagamentos do Asaas...');

      while (hasMore) {
        try {
          const response = await this.listPayments({ limit, offset });
          const payments = response.data || [];
          
          if (payments.length === 0) {
            hasMore = false;
            break;
          }

          console.log(`Processando lote de ${payments.length} pagamentos (offset: ${offset})`);

          for (const payment of payments) {
            try {
              const syncedPayment = await storage.upsertAsaasPayment(payment);
              
              // Verificar se foi criado ou atualizado
              if (syncedPayment && syncedPayment.createdAt && syncedPayment.lastSyncedAt) {
                const isNew = syncedPayment.createdAt.getTime() === syncedPayment.lastSyncedAt.getTime();
                if (isNew) {
                  result.imported++;
                } else {
                  result.updated++;
                }
              }
            } catch (error: any) {
              console.error(`Erro ao importar pagamento ${payment.id}:`, error);
              result.errors.push(`Pagamento ${payment.id}: ${error.message}`);
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

      console.log(`Importação concluída: ${result.imported} novos, ${result.updated} atualizados, ${result.errors.length} erros`);

      return result;
    } catch (error: any) {
      console.error('Erro na importação:', error);
      throw new Error(`Falha na importação: ${error.message}`);
    }
  }

  private getCacheKey(filters: any): string {
    return `payments_${JSON.stringify(filters)}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  async getCustomer(customerId: string): Promise<any> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar cliente ${customerId}:`, error.message);
      return null;
    }
  }

  async getAllPayments(filters: {
    customer?: string;
    status?: string;
    dateCreatedGe?: string;
    dateCreatedLe?: string;
  } = {}): Promise<any[]> {
    try {
      const cacheKey = this.getCacheKey(filters);
      
      // Verificar cache primeiro
      if (this.isValidCache(cacheKey)) {
        console.log('Retornando cobranças do cache');
        return this.cache.get(cacheKey)!.data;
      }

      // CORREÇÃO: Limitação máxima para evitar loop infinito
      // Buscar apenas os últimos 300 pagamentos (3 páginas) para evitar timeout
      const allPayments: any[] = [];
      let offset = 0;
      const limit = 100;
      const maxPages = 3; // Reduzido para 3 páginas (300 registros máximo)
      let currentPage = 0;
      let hasMore = true;

      console.log('Buscando cobranças do Asaas...');

      while (hasMore && currentPage < maxPages) {
        const response = await this.listPayments({ ...filters, limit, offset });
        const payments = response.data || [];
        
        if (payments.length === 0) {
          hasMore = false;
          break;
        }

        allPayments.push(...payments);
        offset += limit;
        currentPage++;
        hasMore = payments.length === limit;
        
        // Log de progresso
        console.log(`Página ${currentPage} carregada: ${payments.length} cobranças`);
        
        // Delay reduzido para melhor performance
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`✓ Cobranças carregadas: ${allPayments.length} registros em ${currentPage} páginas`);
      
      // ENRIQUECER COM DADOS DOS CLIENTES
      const enrichedPayments = await this.enrichPaymentsWithCustomerData(allPayments);
      
      // Armazenar no cache
      this.cache.set(cacheKey, {
        data: enrichedPayments,
        timestamp: Date.now()
      });

      return enrichedPayments;
    } catch (error: any) {
      console.error('Erro ao buscar todas as cobranças:', error);
      throw new Error(`Falha ao buscar cobranças: ${error.message}`);
    }
  }

  private async enrichPaymentsWithCustomerData(payments: any[]): Promise<any[]> {
    const enrichedPayments = [];
    const customerCache = new Map<string, any>();

    for (const payment of payments) {
      try {
        let customerData = customerCache.get(payment.customer);
        
        if (!customerData) {
          customerData = await this.getCustomer(payment.customer);
          if (customerData) {
            customerCache.set(payment.customer, customerData);
          }
        }

        const enrichedPayment = {
          ...payment,
          customerName: customerData?.name || payment.customer,
          customerEmail: customerData?.email || '',
          customerPhone: customerData?.phone || customerData?.mobilePhone || '',
          customerCpfCnpj: customerData?.cpfCnpj || ''
        };

        enrichedPayments.push(enrichedPayment);
        
        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Erro ao enriquecer pagamento ${payment.id}:`, error);
        // Se falhar, usar dados originais
        enrichedPayments.push({
          ...payment,
          customerName: payment.customer,
          customerEmail: '',
          customerPhone: '',
          customerCpfCnpj: ''
        });
      }
    }

    console.log(`✓ ${enrichedPayments.length} pagamentos enriquecidos com dados dos clientes`);
    return enrichedPayments;
  }

  // Buscar detalhes específicos de um pagamento
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      console.log(`Buscando detalhes do pagamento: ${paymentId}`);
      
      const response = await this.client.get(`/payments/${paymentId}`);
      const payment = response.data;
      
      // Enriquecer com dados do cliente
      let customerData = null;
      if (payment.customer) {
        try {
          customerData = await this.getCustomer(payment.customer);
        } catch (error) {
          console.warn(`Erro ao buscar cliente ${payment.customer}:`, error);
        }
      }
      
      return {
        ...payment,
        customerName: customerData?.name || payment.customer,
        customerEmail: customerData?.email || '',
        customerPhone: customerData?.phone || customerData?.mobilePhone || '',
        customerCpfCnpj: customerData?.cpfCnpj || ''
      };
    } catch (error: any) {
      console.error(`Erro ao buscar detalhes do pagamento ${paymentId}:`, error);
      throw new Error(`Falha ao buscar detalhes: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Reenviar cobrança por email
  async resendPayment(paymentId: string): Promise<any> {
    try {
      console.log(`Reenviando cobrança: ${paymentId}`);
      
      const response = await this.client.post(`/payments/${paymentId}/paymentBook`);
      
      return {
        success: true,
        message: 'Cobrança reenviada com sucesso',
        data: response.data
      };
    } catch (error: any) {
      console.error(`Erro ao reenviar cobrança ${paymentId}:`, error);
      throw new Error(`Falha ao reenviar: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Cancelar pagamento
  async cancelPayment(paymentId: string): Promise<any> {
    try {
      console.log(`Cancelando pagamento: ${paymentId}`);
      
      const response = await this.client.delete(`/payments/${paymentId}`);
      
      return {
        success: true,
        message: 'Pagamento cancelado com sucesso',
        data: response.data
      };
    } catch (error: any) {
      console.error(`Erro ao cancelar pagamento ${paymentId}:`, error);
      throw new Error(`Falha ao cancelar: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Estornar pagamento
  async refundPayment(paymentId: string): Promise<any> {
    try {
      console.log(`Estornando pagamento: ${paymentId}`);
      
      // Primeiro buscar o pagamento para verificar se pode ser estornado
      const paymentDetails = await this.client.get(`/payments/${paymentId}`);
      
      if (paymentDetails.data.status !== 'RECEIVED') {
        throw new Error('Apenas pagamentos recebidos podem ser estornados');
      }
      
      const response = await this.client.post(`/payments/${paymentId}/refund`, {
        value: paymentDetails.data.value,
        description: 'Estorno solicitado via sistema administrativo'
      });
      
      return {
        success: true,
        message: 'Estorno processado com sucesso',
        data: response.data
      };
    } catch (error: any) {
      console.error(`Erro ao estornar pagamento ${paymentId}:`, error);
      throw new Error(`Falha ao estornar: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async syncAllPayments(): Promise<{ synced: number; errors: string[] }> {
    const { storage } = await import('../storage');
    try {
      const result = { synced: 0, errors: [] as string[] };
      
      // Obter data da última sincronização
      const lastSyncDate = await storage.getLastSyncDate();
      
      // Configurar filtros para buscar apenas pagamentos novos/atualizados
      const filters: any = {
        limit: 100 // Sincronizar até 100 pagamentos por vez
      };
      
      // Se existe sincronização anterior, buscar apenas pagamentos atualizados
      if (lastSyncDate) {
        filters.dateCreatedGe = lastSyncDate.toISOString().split('T')[0];
      }
      
      console.log('Iniciando sincronização com filtros:', filters);
      
      // Buscar pagamentos do Asaas
      const response = await this.client.get('/payments', { params: filters });
      const asaasPayments = response.data.data || [];
      
      console.log(`Encontrados ${asaasPayments.length} pagamentos para sincronizar`);
      
      // Sincronizar cada pagamento
      for (const asaasPayment of asaasPayments) {
        try {
          await storage.upsertAsaasPayment(asaasPayment);
          result.synced++;
        } catch (error: any) {
          console.error(`Erro ao sincronizar pagamento ${asaasPayment.id}:`, error);
          result.errors.push(`Pagamento ${asaasPayment.id}: ${error.message}`);
        }
      }
      
      console.log(`Sincronização concluída: ${result.synced} pagamentos sincronizados, ${result.errors.length} erros`);
      
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
      'RECEIVED': 'paid',
      'RECEIVED_IN_CASH': 'paid',
      'CONFIRMED': 'paid',
      'OVERDUE': 'overdue',
      'CANCELLED': 'failed',
      'REFUNDED': 'refunded',
      'REFUND_REQUESTED': 'refunded'
    };

    return statusMap[asaasStatus] || 'pending';
  }

  // Método para limpar cache manualmente
  clearCache(): void {
    this.cache.clear();
    console.log('Cache do Asaas limpo');
  }

  // Método para obter informações do cache
  getCacheInfo(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const asaasService = new AsaasService();