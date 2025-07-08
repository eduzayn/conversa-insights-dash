import { BOTCONVERSA_CONFIG, getAuthHeaders, formatPhoneForBotConversa, validatePhone } from '../config/botconversa';
import { storage } from '../storage';
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
    const headers = getAuthHeaders(account);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`BotConversa API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Buscar subscriber por telefone
  async getSubscriberByPhone(phone: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaSubscriber | null> {
    try {
      const formattedPhone = formatPhoneForBotConversa(phone);
      const data = await this.makeRequest(`/subscriber/phone/${formattedPhone}`, account, { method: 'GET' });
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar subscriber:', error);
      return null;
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
      content: message.content,
      messageType: message.type,
      timestamp: new Date(message.timestamp),
      isRead: false
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
    
    // Criar lead no CRM
    const lead: InsertLead = {
      name: subscriber.name || 'Contato sem nome',
      phone: subscriber.phone,
      email: subscriber.email || null,
      source: `BotConversa ${account}`,
      status: 'new',
      teamId: account === 'COMERCIAL' ? 2 : 1, // Vendas para comercial, Atendimento para suporte
      assignedTo: null,
      customFields: subscriber.custom_fields || {}
    };
    
    await storage.createLead(lead);
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
    
    // Criar nova conversa
    const newConversation: InsertConversation = {
      customerName: subscriber.name || 'Contato sem nome',
      customerPhone: subscriber.phone,
      customerEmail: subscriber.email || null,
      attendantId: null,
      status: 'waiting',
      priority: 'medium',
      subject: `Atendimento via BotConversa ${account}`,
      teamId: account === 'COMERCIAL' ? 2 : 1,
      lastMessageAt: new Date()
    };
    
    return await storage.createConversation(newConversation);
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
}

export const botConversaService = new BotConversaService();