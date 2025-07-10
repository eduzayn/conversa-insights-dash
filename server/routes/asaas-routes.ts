import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createAsaasService } from '../services/unified-asaas-service';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware de autenticação simplificado
const auth = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Conta desativada' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na validação do token:', error);
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Função para obter a chave da API do Asaas
const getAsaasApiKey = (): string => {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada nas variáveis de ambiente');
  }
  return apiKey;
};

// Função para determinar se é sandbox
const isSandbox = (): boolean => {
  return process.env.ASAAS_ENVIRONMENT === 'sandbox';
};

// Schema para validação de filtros de pagamentos
const paymentFiltersSchema = z.object({
  customer: z.string().optional(),
  status: z.string().optional(),
  billingType: z.string().optional(),
  dateCreatedGe: z.string().optional(),
  dateCreatedLe: z.string().optional(),
  dueDateGe: z.string().optional(),
  dueDateLe: z.string().optional(),
  paymentDateGe: z.string().optional(),
  paymentDateLe: z.string().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Schema para criação de clientes
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  observations: z.string().optional()
});

// Schema para criação de pagamentos
const createPaymentSchema = z.object({
  customer: z.string().min(1, 'Cliente é obrigatório'),
  billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX', 'DEBIT_CARD'], {
    errorMap: () => ({ message: 'Tipo de cobrança inválido' })
  }),
  value: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().optional(),
  externalReference: z.string().optional(),
  installmentCount: z.number().positive().optional(),
  installmentValue: z.number().positive().optional(),
  discount: z.object({
    value: z.number().positive(),
    dueDateLimitDays: z.number().positive()
  }).optional(),
  interest: z.object({
    value: z.number().positive()
  }).optional(),
  fine: z.object({
    value: z.number().positive()
  }).optional(),
  postalService: z.boolean().optional()
});

// Schema para lembretes
const reminderSchema = z.object({
  type: z.enum(['email', 'sms', 'both']).default('email')
});

// Schema para estorno
const refundSchema = z.object({
  value: z.number().positive().optional(),
  description: z.string().optional()
});

// Schema para configuração de webhook
const webhookConfigSchema = z.object({
  url: z.string().url('URL inválida'),
  email: z.string().email('Email inválido'),
  events: z.array(z.string()),
  authToken: z.string().optional()
});

// Middleware para capturar erros
const handleAsaasError = (error: any, res: any) => {
  console.error('[Asaas Error]', error);
  
  if (error.message.includes('ASAAS_API_KEY')) {
    return res.status(500).json({
      error: 'Configuração da API do Asaas não encontrada',
      message: 'Entre em contato com o administrador do sistema'
    });
  }
  
  return res.status(500).json({
    error: 'Erro na comunicação com o Asaas',
    message: error.message || 'Erro interno do servidor'
  });
};

// Rota para testar conexão
router.get('/test-connection', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.testConnection();
    res.json(result);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Rota para buscar informações da conta
router.get('/account', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const accountInfo = await asaas.getAccountInfo();
    res.json(accountInfo);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// === ROTAS DE CLIENTES ===

// Listar clientes
router.get('/customers', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const { name, email, cpfCnpj, offset, limit } = req.query;
    
    const customers = await asaas.getCustomers({
      name: name as string,
      email: email as string,
      cpfCnpj: cpfCnpj as string,
      offset: offset ? parseInt(offset as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.json(customers);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Buscar cliente por ID
router.get('/customers/:id', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const customer = await asaas.getCustomer(req.params.id);
    res.json(customer);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Criar cliente
router.post('/customers', auth, async (req, res) => {
  try {
    const customerData = createCustomerSchema.parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const customer = await asaas.createCustomer(customerData);
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Atualizar cliente
router.put('/customers/:id', auth, async (req, res) => {
  try {
    const customerData = createCustomerSchema.partial().parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const customer = await asaas.updateCustomer(req.params.id, customerData);
    res.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Remover cliente
router.delete('/customers/:id', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    await asaas.deleteCustomer(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// === ROTAS DE PAGAMENTOS ===

// Estatísticas de pagamentos (DEVE VIR ANTES da rota /:id)
router.get('/payments/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const stats = await asaas.getPaymentStats(startDate as string, endDate as string);
    res.json(stats);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Listar pagamentos
router.get('/payments', auth, async (req, res) => {
  try {
    const filters = paymentFiltersSchema.parse(req.query);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    
    // Converter page para offset se necessário
    if (filters.page && !filters.offset) {
      const limit = filters.limit || 20;
      filters.offset = (filters.page - 1) * limit;
    }
    
    const paymentsResponse = await asaas.getPayments(filters);
    const payments = paymentsResponse.data || [];
    
    // Buscar dados dos clientes para enriquecer a resposta
    const customersMap = new Map();
    
    for (const payment of payments) {
      if (payment.customer && !customersMap.has(payment.customer)) {
        try {
          const customerData = await asaas.getCustomer(payment.customer);
          customersMap.set(payment.customer, customerData);
        } catch (error) {
          // Se não conseguir buscar o cliente, continua sem erro
          console.warn(`Erro ao buscar cliente ${payment.customer}:`, error);
          customersMap.set(payment.customer, null);
        }
      }
      
      // Adicionar customerData ao pagamento
      payment.customerData = customersMap.get(payment.customer);
    }
    
    // Retornar resposta original com dados enriquecidos
    const enrichedResponse = {
      ...paymentsResponse,
      data: payments
    };
    
    res.json(enrichedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Buscar pagamento por ID
router.get('/payments/:id', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const payment = await asaas.getPayment(req.params.id);
    res.json(payment);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Criar pagamento
router.post('/payments', auth, async (req, res) => {
  try {
    const paymentData = createPaymentSchema.parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const payment = await asaas.createPayment(paymentData);
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Atualizar pagamento
router.put('/payments/:id', auth, async (req, res) => {
  try {
    const paymentData = createPaymentSchema.partial().parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const payment = await asaas.updatePayment(req.params.id, paymentData);
    res.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Cancelar pagamento
router.post('/payments/:id/cancel', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.cancelPayment(req.params.id);
    res.json(result);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Remover pagamento
router.delete('/payments/:id', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    await asaas.deletePayment(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Estornar pagamento
router.post('/payments/:id/refund', auth, async (req, res) => {
  try {
    const refundData = refundSchema.parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.refundPayment(req.params.id, refundData.value, refundData.description);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Enviar lembrete de pagamento
router.post('/payments/:id/reminder', auth, async (req, res) => {
  try {
    const { type } = reminderSchema.parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.sendPaymentReminder(req.params.id, type);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Gerar segunda via de boleto
router.get('/payments/:id/bank-slip', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.generateBankSlip(req.params.id);
    res.json(result);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Buscar QR Code PIX
router.get('/payments/:id/pix-qrcode', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.getPixQrCode(req.params.id);
    res.json(result);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// === ROTAS DE SINCRONIZAÇÃO ===

// Sincronizar pagamentos
router.post('/payments/sync', auth, async (req, res) => {
  try {
    const { lastSyncDate } = req.body;
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.syncPayments(lastSyncDate);
    res.json({
      success: true,
      message: `${result.total} pagamentos sincronizados`,
      data: result
    });
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Importar todos os pagamentos
router.post('/payments/import', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.syncPayments();
    res.json({
      success: true,
      message: `${result.total} pagamentos importados`,
      data: result
    });
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// Status da sincronização
router.get('/sync/status', auth, async (req, res) => {
  try {
    // Aqui você pode implementar lógica para buscar o status da sincronização
    // Por exemplo, da base de dados local
    res.json({
      isActive: true,
      lastSync: new Date().toISOString(),
      totalLocalPayments: 0,
      syncedPayments: 0,
      syncFrequency: 'manual',
      nextSync: null
    });
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// === ROTAS DE ESTATÍSTICAS ===

// (Estatísticas de pagamentos movidas para cima para evitar conflito com /:id)

// === ROTAS DE RELATÓRIOS ===

// Gerar relatório financeiro
router.get('/reports/financial', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const report = await asaas.generateFinancialReport(startDate as string, endDate as string);
    res.json(report);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// === ROTAS DE WEBHOOK ===

// Configurar webhook
router.post('/webhook/configure', auth, async (req, res) => {
  try {
    const webhookConfig = webhookConfigSchema.parse(req.body);
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const result = await asaas.configureWebhook(webhookConfig);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    handleAsaasError(error, res);
  }
});

// Listar webhooks
router.get('/webhook', auth, async (req, res) => {
  try {
    const asaas = createAsaasService(getAsaasApiKey(), isSandbox());
    const webhooks = await asaas.getWebhooks();
    res.json(webhooks);
  } catch (error) {
    handleAsaasError(error, res);
  }
});

// === ROTAS DE CONFIGURAÇÃO ===

// Configurar notificações automáticas
router.post('/notifications/configure', auth, async (req, res) => {
  try {
    const { emailEnabled, smsEnabled, reminderDaysBefore, overdueReminderDays } = req.body;
    
    // Aqui você pode salvar as configurações no banco de dados
    // Por enquanto, vamos apenas retornar sucesso
    res.json({
      success: true,
      message: 'Configurações de notificação atualizadas com sucesso',
      config: {
        emailEnabled,
        smsEnabled,
        reminderDaysBefore,
        overdueReminderDays
      }
    });
  } catch (error) {
    handleAsaasError(error, res);
  }
});

export default router;