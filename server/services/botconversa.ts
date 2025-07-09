import { BOTCONVERSA_CONFIG, getAuthHeaders, formatPhoneForBotConversa, validatePhone } from '../config/botconversa';
import { storage } from '../storage';
import { routingService } from './routing';
import type { Lead, InsertLead, Conversation, InsertConversation, AttendanceMessage, InsertAttendanceMessage } from '@shared/schema';

export interface BotConversaSubscriber {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface BotConversaWebhookData {
  subscriber: BotConversaSubscriber;
  message?: {
    id: string;
    content: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document';
    timestamp: string;
    direction: 'incoming' | 'outgoing';
  };
  event_type: 'new_message' | 'subscriber_created' | 'subscriber_updated' | 'tag_added' | 'tag_removed';
  webhook_id: string;
  company_id: string;
  timestamp: string;
}

export class BotConversaService {
  private baseUrl = BOTCONVERSA_CONFIG.API_BASE_URL;
  
  // Fazer requisição para API do BotConversa
  private async makeRequest(endpoint: string, account: 'SUPORTE' | 'COMERCIAL', options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const apiKey = BOTCONVERSA_CONFIG.API_KEYS[account];
    
    // Verifica se a chave API está configurada
    if (!apiKey) {
      throw new Error(`Chave API não configurada para a conta ${account}`);
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'BotConversa-Analytics/1.0',
      'api-key': apiKey,
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Log detalhado para debug
      console.error(`Erro BotConversa API:`, {
        account,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        response: errorText,
        headers: Object.keys(headers)
      });
      
      throw new Error(`BotConversa API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  }
  
  // Buscar subscriber por telefone
  async getSubscriberByPhone(phone: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaSubscriber | null> {
    try {
      const formattedPhone = formatPhoneForBotConversa(phone);
      const data = await this.makeRequest(`/subscriber/get_by_phone/${formattedPhone}/`, account, { method: 'GET' });
      return data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Se é 404, significa que o subscriber não foi encontrado (comportamento esperado)
      if (errorMessage.includes('404')) {
        console.log(`Subscriber não encontrado para o telefone: ${phone}`);
        return null;
      }
      
      // Para outros erros, log detalhado
      console.error('Erro ao buscar subscriber:', error);
      throw error; // Re-throw para que o erro seja tratado no endpoint
    }
  }
  
  // Criar novo subscriber
  async createSubscriber(subscriberData: {
    phone: string;
    name?: string;
    email?: string;
    custom_fields?: Record<string, any>;
  }, account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaSubscriber> {
    const formattedPhone = formatPhoneForBotConversa(subscriberData.phone);
    
    const payload = {
      phone: formattedPhone,
      name: subscriberData.name || '',
      email: subscriberData.email || '',
      custom_fields: subscriberData.custom_fields || {}
    };
    
    return this.makeRequest('/subscriber/', account, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
  
  // Adicionar tag ao subscriber
  async addTagToSubscriber(subscriberId: string, tagId: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    await this.makeRequest(`/subscriber/${subscriberId}/tags/${tagId}`, account, {
      method: 'POST'
    });
  }
  
  // Remover tag do subscriber
  async removeTagFromSubscriber(subscriberId: string, tagId: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    await this.makeRequest(`/subscriber/${subscriberId}/tags/${tagId}`, account, {
      method: 'DELETE'
    });
  }
  
  // Enviar mensagem para subscriber
  async sendMessageToSubscriber(subscriberId: string, message: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    await this.makeRequest(`/subscriber/${subscriberId}/send_message`, account, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
  
  // Enviar fluxo para subscriber
  async sendFlowToSubscriber(subscriberId: string, flowId: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    await this.makeRequest(`/subscriber/${subscriberId}/send_flow`, account, {
      method: 'POST',
      body: JSON.stringify({ flow_id: flowId })
    });
  }
  
  // Buscar todos os subscribers
  async getSubscribers(account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaSubscriber[]> {
    try {
      const data = await this.makeRequest('/subscribers/', account, { method: 'GET' });
      return data.results || [];
    } catch (error) {
      console.error('Erro ao buscar subscribers:', error);
      return [];
    }
  }
  
  // Buscar mensagens de um subscriber
  async getSubscriberMessages(subscriberId: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<any[]> {
    try {
      const data = await this.makeRequest(`/subscriber/${subscriberId}/messages/`, account, { method: 'GET' });
      return data.results || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }
  
  // Sincronizar conversas do BotConversa com o sistema
  async syncConversations(account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    try {
      console.log(`Sincronizando conversas da conta ${account}...`);
      
      // Buscar subscribers do BotConversa
      const subscribers = await this.getSubscribers(account);
      
      // Para cada subscriber, criar ou atualizar conversa
      for (const subscriber of subscribers) {
        await this.syncSubscriberConversation(subscriber, account);
      }
      
      console.log(`Sincronização concluída para ${account}: ${subscribers.length} subscribers processados`);
    } catch (error) {
      console.error(`Erro ao sincronizar conversas da conta ${account}:`, error);
    }
  }
  
  // Sincronizar conversa de um subscriber específico
  async syncSubscriberConversation(subscriber: BotConversaSubscriber, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    try {
      // Buscar conversa existente
      const existingConversation = await this.findOrCreateConversation(subscriber, account);
      
      // Buscar mensagens do subscriber
      const messages = await this.getSubscriberMessages(subscriber.id, account);
      
      // Atualizar última atividade da conversa
      if (messages.length > 0) {
        const lastMessage = messages[0];
        await storage.updateConversation(existingConversation.id, {
          lastMessageAt: new Date(lastMessage.timestamp || subscriber.updated_at),
          status: 'active'
        });
        
        // Sincronizar mensagens
        await this.syncMessages(existingConversation.id, messages);
      }
    } catch (error) {
      console.error(`Erro ao sincronizar conversa do subscriber ${subscriber.id}:`, error);
    }
  }
  
  // Sincronizar mensagens de uma conversa
  async syncMessages(conversationId: number, messages: any[]): Promise<void> {
    try {
      // Buscar mensagens existentes
      const existingMessages = await storage.getConversationMessages(conversationId, 1000, 0);
      const existingMessageIds = new Set(existingMessages.map(msg => msg.externalId).filter(Boolean));
      
      // Adicionar apenas mensagens novas
      for (const message of messages) {
        if (!existingMessageIds.has(message.id)) {
          const attendanceMessage: InsertAttendanceMessage = {
            conversationId,
            senderId: message.direction === 'incoming' ? null : 1,
            senderType: message.direction === 'incoming' ? 'student' : 'attendant',
            content: message.content,
            type: message.type,
            externalId: message.id
          };
          
          await storage.createAttendanceMessage(attendanceMessage);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar mensagens:', error);
    }
  }
  
  // Definir valor de campo personalizado
  async setCustomField(subscriberId: string, fieldId: string, value: any, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    await this.makeRequest(`/subscriber/${subscriberId}/custom_fields/${fieldId}`, account, {
      method: 'POST',
      body: JSON.stringify({ value })
    });
  }
  
  // Processar webhook do BotConversa
  async processWebhook(webhookData: BotConversaWebhookData, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    console.log(`Processando webhook ${webhookData.event_type} da conta ${account}:`, webhookData);
    
    try {
      switch (webhookData.event_type) {
        case 'new_message':
          await this.processNewMessage(webhookData, account);
          break;
          
        case 'subscriber_created':
          await this.processSubscriberCreated(webhookData, account);
          break;
          
        case 'subscriber_updated':
          await this.processSubscriberUpdated(webhookData, account);
          break;
          
        case 'tag_added':
        case 'tag_removed':
          await this.processTagChanged(webhookData, account);
          break;
          
        default:
          console.log(`Evento não tratado: ${webhookData.event_type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }
  
  // Processar nova mensagem
  private async processNewMessage(webhookData: BotConversaWebhookData, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    if (!webhookData.message) return;
    
    const subscriber = webhookData.subscriber;
    const message = webhookData.message;
    
    // Buscar ou criar conversa
    let conversation = await this.findOrCreateConversation(subscriber, account);
    
    // Criar mensagem de atendimento
    const attendanceMessage: InsertAttendanceMessage = {
      conversationId: conversation.id,
      senderId: message.direction === 'incoming' ? null : 1, // null para cliente, 1 para sistema
      senderType: message.direction === 'incoming' ? 'student' : 'attendant',
      content: message.content,
      type: message.type,
      externalId: message.id
    };
    
    await storage.createAttendanceMessage(attendanceMessage);
    
    // Atualizar última atividade da conversa
    await storage.updateConversation(conversation.id, {
      lastMessageAt: new Date(message.timestamp),
      status: 'active'
    });
  }
  
  // Processar subscriber criado
  private async processSubscriberCreated(webhookData: BotConversaWebhookData, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    const subscriber = webhookData.subscriber;
    
    // Determinar departamento baseado no roteamento
    const department = await routingService.routeSubscriber(subscriber, account);
    const assignedUser = await routingService.findBestAttendant(department, account);
    
    // Mapear status baseado nas tags
    const statusMapping = account === 'COMERCIAL' 
      ? BOTCONVERSA_CONFIG.COMERCIAL.TAG_TO_STATUS_MAPPING 
      : {};
    
    let status = 'new';
    if (subscriber.tags) {
      for (const tag of subscriber.tags) {
        if (statusMapping[tag]) {
          status = statusMapping[tag];
          break;
        }
      }
    }
    
    // Criar lead no CRM
    const lead: InsertLead = {
      name: subscriber.name || 'Contato sem nome',
      phone: subscriber.phone,
      email: subscriber.email || null,
      source: `BotConversa ${account} - ${department}`,
      status,
      companyAccount: account, // Adicionar companyAccount
      teamId: account === 'COMERCIAL' ? 2 : 1, // Vendas para comercial, Atendimento para suporte
      assignedTo: assignedUser
    };
    
    await storage.createLead(lead);
    console.log(`Lead criado no CRM - Departamento: ${department}, Atendente: ${assignedUser}`);
  }
  
  // Processar subscriber atualizado
  private async processSubscriberUpdated(webhookData: BotConversaWebhookData, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    const subscriber = webhookData.subscriber;
    
    // Buscar lead existente pelo telefone
    const leads = await storage.getLeads({ teamId: account === 'COMERCIAL' ? 2 : 1 });
    const existingLead = leads.find(lead => lead.phone === subscriber.phone);
    
    if (existingLead) {
      // Atualizar lead existente
      await storage.updateLead(existingLead.id, {
        name: subscriber.name || existingLead.name,
        email: subscriber.email || existingLead.email,
        customFields: { ...existingLead.customFields, ...subscriber.custom_fields }
      });
    }
  }
  
  // Processar mudança de tag
  private async processTagChanged(webhookData: BotConversaWebhookData, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    const subscriber = webhookData.subscriber;
    const tags = subscriber.tags || [];
    
    // Buscar lead existente pelo telefone
    const leads = await storage.getLeads({ teamId: account === 'COMERCIAL' ? 2 : 1 });
    const existingLead = leads.find(lead => lead.phone === subscriber.phone);
    
    if (existingLead && tags.length > 0) {
      // Mapear tag para status do CRM
      const tagToStatusMapping = BOTCONVERSA_CONFIG.COMERCIAL.TAG_TO_STATUS_MAPPING;
      const latestTag = tags[tags.length - 1];
      const newStatus = tagToStatusMapping[latestTag] || existingLead.status;
      
      await storage.updateLead(existingLead.id, {
        status: newStatus
      });
    }
  }
  
  // Buscar ou criar conversa
  private async findOrCreateConversation(subscriber: BotConversaSubscriber, account: 'SUPORTE' | 'COMERCIAL'): Promise<Conversation> {
    // Buscar conversa existente
    const conversations = await storage.getConversations();
    const existingConversation = conversations.find(conv => 
      conv.customerPhone === subscriber.phone && 
      conv.status === 'active'
    );
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Buscar ou criar lead primeiro
    const leads = await storage.getLeads({ teamId: account === 'COMERCIAL' ? 2 : 1 });
    let lead = leads.find(l => l.phone === subscriber.phone);
    
    if (!lead) {
      // Criar lead se não existir
      const newLead: InsertLead = {
        name: subscriber.name || 'Contato sem nome',
        phone: subscriber.phone,
        email: subscriber.email || null,
        source: `BotConversa ${account}`,
        status: 'new',
        companyAccount: account,
        teamId: account === 'COMERCIAL' ? 2 : 1,
        assignedTo: null
      };
      
      lead = await storage.createLead(newLead);
    }
    
    // Criar nova conversa
    const newConversation: InsertConversation = {
      leadId: lead.id,
      attendantId: null,
      status: 'active'
    };
    
    const conversation = await storage.createConversation(newConversation);
    
    // Atualizar com informações do cliente
    await storage.updateConversation(conversation.id, {
      customerName: subscriber.name || 'Contato sem nome',
      customerPhone: subscriber.phone
    });
    
    return { ...conversation, customerName: subscriber.name || 'Contato sem nome', customerPhone: subscriber.phone };
  }
  
  // Sincronizar dados do BotConversa com CRM
  async syncWithCRM(account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    console.log(`Iniciando sincronização com BotConversa - Conta: ${account}`);
    
    try {
      // Buscar todos os subscribers
      const subscribers = await this.makeRequest('/subscribers/', account);
      
      if (subscribers && subscribers.results) {
        for (const subscriber of subscribers.results) {
          await this.processSubscriberCreated({ 
            subscriber, 
            event_type: 'subscriber_created',
            webhook_id: 'sync',
            company_id: account,
            timestamp: new Date().toISOString()
          }, account);
        }
      }
      
      console.log(`Sincronização concluída - Conta: ${account}`);
    } catch (error) {
      console.error(`Erro na sincronização - Conta: ${account}:`, error);
      throw error;
    }
  }

  // Buscar informações do fluxo de boas vindas
  async getWelcomeFlowInfo(account: 'SUPORTE' | 'COMERCIAL') {
    try {
      // Mapear as configurações do fluxo baseado na conta
      const flowConfig = {
        SUPORTE: {
          name: "Fluxo de Boas Vindas - Suporte",
          description: "Fluxo para direcionamento de estudantes aos departamentos corretos",
          departments: BOTCONVERSA_CONFIG.SUPORTE.DEPARTMENTS,
          routingRules: BOTCONVERSA_CONFIG.SUPORTE.ROUTING_RULES,
          steps: [
            {
              id: "welcome",
              name: "Boas Vindas",
              description: "Mensagem inicial de boas vindas",
              type: "message"
            },
            {
              id: "menu",
              name: "Menu de Opções",
              description: "Apresenta opções de atendimento",
              type: "menu",
              options: Object.keys(BOTCONVERSA_CONFIG.SUPORTE.ROUTING_RULES)
            },
            {
              id: "routing",
              name: "Roteamento",
              description: "Direciona para o departamento correto",
              type: "routing"
            }
          ],
          integration: {
            webhookUrl: "/webhook/botconversa/suporte",
            crmStatus: "active",
            autoRouting: true
          }
        },
        COMERCIAL: {
          name: "Fluxo de Boas Vindas - Comercial",
          description: "Fluxo para captação e qualificação de leads",
          departments: BOTCONVERSA_CONFIG.COMERCIAL.DEPARTMENTS,
          routingRules: BOTCONVERSA_CONFIG.COMERCIAL.ROUTING_RULES,
          steps: [
            {
              id: "welcome",
              name: "Boas Vindas",
              description: "Mensagem inicial de boas vindas",
              type: "message"
            },
            {
              id: "qualification",
              name: "Qualificação",
              description: "Coleta informações do lead",
              type: "form"
            },
            {
              id: "routing",
              name: "Roteamento",
              description: "Direciona para o departamento correto",
              type: "routing"
            }
          ],
          integration: {
            webhookUrl: "/webhook/botconversa/comercial",
            crmStatus: "active",
            autoRouting: true,
            statusMapping: BOTCONVERSA_CONFIG.COMERCIAL.TAG_TO_STATUS_MAPPING
          }
        }
      };

      return flowConfig[account];
    } catch (error) {
      console.error(`Erro ao buscar informações do fluxo - Conta: ${account}:`, error);
      throw error;
    }
  }
}

export const botConversaService = new BotConversaService();