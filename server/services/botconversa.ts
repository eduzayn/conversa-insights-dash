import { BOTCONVERSA_CONFIG, getAuthHeaders, formatPhoneForBotConversa, validatePhone } from '../config/botconversa';
import { storage } from '../storage';
import { routingService } from './routing';
import type { Lead, InsertLead, Conversation, InsertConversation, AttendanceMessage, InsertAttendanceMessage } from '@shared/schema';

export interface BotConversaManager {
  id: number;
  email: string;
  full_name: string;
  dashboard: boolean;
  campaigns: boolean;
  audience: boolean;
  assign_chat: number;
  automation: boolean;
  flows: boolean;
  settings: boolean;
  live_chat: boolean;
  live_chat_all: boolean;
  live_chat_my_busy: boolean;
  live_chat_all_busy: boolean;
  broadcasts: boolean;
  adding_new_managers: boolean;
  online_status: number;
}

export interface BotConversaSubscriber {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Campos adicionais da API real
  full_name?: string;
  first_name?: string;
  last_name?: string;
  ddd?: string;
  live_chat?: string;
  referrer?: string;
  referral_count?: number;
  campaigns?: any[];
  variables?: Record<string, any>;
  sequences?: any[];
  // Campos para atribuição de atendente
  assigned_manager?: BotConversaManager;
  assigned_manager_id?: number;
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
  private managersCache: Map<string, BotConversaManager[]> = new Map(); // Cache para managers por conta
  
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
  
  // Buscar managers de uma conta
  async getManagers(account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaManager[]> {
    try {
      // Verifica cache primeiro
      const cached = this.managersCache.get(account);
      if (cached) {
        return cached;
      }

      const data = await this.makeRequest('/managers/', account, { method: 'GET' });
      const managers = data || [];
      
      // Salva no cache
      this.managersCache.set(account, managers);
      
      return managers;
    } catch (error) {
      console.error(`Erro ao buscar managers da conta ${account}:`, error);
      return [];
    }
  }

  // Buscar manager por ID
  async getManagerById(managerId: number, account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaManager | null> {
    try {
      const managers = await this.getManagers(account);
      return managers.find(m => m.id === managerId) || null;
    } catch (error) {
      console.error(`Erro ao buscar manager ${managerId} da conta ${account}:`, error);
      return null;
    }
  }

  // Detectar manager atribuído ao subscriber
  private async detectAssignedManager(subscriber: BotConversaSubscriber, account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaManager | null> {
    try {
      const managers = await this.getManagers(account);
      
      // Estratégia 1: Verificar se há um manager_id no subscriber
      if (subscriber.assigned_manager_id) {
        return await this.getManagerById(subscriber.assigned_manager_id, account);
      }
      
      // Estratégia 2: Verificar campos personalizados por manager
      if (subscriber.custom_fields) {
        const managerFields = ['manager_id', 'assignedTo', 'atendente', 'responsible'];
        for (const field of managerFields) {
          if (subscriber.custom_fields[field]) {
            const managerId = parseInt(subscriber.custom_fields[field]);
            if (!isNaN(managerId)) {
              return await this.getManagerById(managerId, account);
            }
          }
        }
      }
      
      // Estratégia 3: Verificar variáveis do BotConversa
      if (subscriber.variables) {
        const managerFields = ['manager_id', 'assignedTo', 'atendente', 'responsible'];
        for (const field of managerFields) {
          if (subscriber.variables[field]) {
            const managerId = parseInt(subscriber.variables[field]);
            if (!isNaN(managerId)) {
              return await this.getManagerById(managerId, account);
            }
          }
        }
      }
      
      // Estratégia 4: Verificar se há um manager implícito baseado em tags/estado
      if (subscriber.tags) {
        // Procurar por tags que correspondem a nomes de managers
        for (const tag of subscriber.tags) {
          const manager = managers.find(m => 
            m.full_name.toLowerCase().includes(tag.toLowerCase()) ||
            m.email.toLowerCase().includes(tag.toLowerCase())
          );
          if (manager) {
            return manager;
          }
        }
      }
      
      // Estratégia 5: Usar distribuição round-robin baseada em assign_chat
      // Se não há atribuição específica, usar managers com assign_chat > 0
      const availableManagers = managers.filter(m => m.assign_chat > 0);
      
      if (availableManagers.length > 0) {
        // Ordenar por assign_chat (prioridade) e depois por ID para consistência
        availableManagers.sort((a, b) => {
          if (a.assign_chat !== b.assign_chat) {
            return b.assign_chat - a.assign_chat; // Maior prioridade primeiro
          }
          return a.id - b.id; // ID menor primeiro para consistência
        });
        
        // Usar hash simples baseado no ID do subscriber para distribuição consistente
        const subscriberHash = parseInt(subscriber.id) || 0;
        const managerIndex = subscriberHash % availableManagers.length;
        const selectedManager = availableManagers[managerIndex];
        
        console.log(`Auto-atribuição: ${subscriber.phone} → ${selectedManager.full_name} (${account})`);
        return selectedManager;
      }
      
      // Se não encontrou nenhum manager específico, retornar null
      return null;
    } catch (error) {
      console.error(`Erro ao detectar manager atribuído para subscriber ${subscriber.id}:`, error);
      return null;
    }
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

  // Atualizar status da conversa no BotConversa via tags
  async updateConversationStatusInBotConversa(customerPhone: string, newStatus: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    try {
      const subscriber = await this.getSubscriberByPhone(customerPhone, account);
      
      if (subscriber) {
        // Mapeamento de status para tags do BotConversa
        const statusTags = {
          'Em andamento': 'conversa_ativa',
          'Concluído': 'conversa_concluida',
          'Pendente': 'conversa_pendente'
        };
        
        const allStatusTags = Object.values(statusTags);
        const newStatusTag = statusTags[newStatus as keyof typeof statusTags];
        
        if (newStatusTag) {
          // Remover todas as tags de status anteriores
          const currentTags = subscriber.tags || [];
          for (const tagToRemove of allStatusTags) {
            if (currentTags.includes(tagToRemove)) {
              try {
                await this.removeTagFromSubscriber(subscriber.id, tagToRemove, account);
              } catch (error) {
                console.log(`Tag ${tagToRemove} não encontrada para remover`);
              }
            }
          }
          
          // Adicionar nova tag de status
          await this.addTagToSubscriber(subscriber.id, newStatusTag, account);
          
          console.log(`Status atualizado no BotConversa: ${customerPhone} → ${newStatus} (${account})`);
        }
      }
    } catch (error) {
      console.error(`Erro ao atualizar status no BotConversa para ${customerPhone}:`, error);
      // Não falha a operação local se houver erro no BotConversa
    }
  }
  
  // Buscar todos os subscribers
  async getSubscribers(account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaSubscriber[]> {
    try {
      const data = await this.makeRequest('/subscribers/', account, { method: 'GET' });
      const subscribers = data.results || [];
      
      // Log detalhado para análise dos dados
      if (subscribers.length > 0) {
        console.log(`[${account}] Exemplo de subscriber recebido:`, JSON.stringify(subscribers[0], null, 2));
      }
      
      return subscribers;
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
  
  // Buscar subscriber específico por ID
  async getSubscriberById(subscriberId: string, account: 'SUPORTE' | 'COMERCIAL'): Promise<BotConversaSubscriber | null> {
    try {
      const subscriber = await this.makeRequest(`/subscriber/${subscriberId}/`, account, { method: 'GET' });
      console.log(`[${account}] Detalhes do subscriber ${subscriberId}:`, JSON.stringify(subscriber, null, 2));
      return subscriber;
    } catch (error) {
      console.error(`Erro ao buscar subscriber ${subscriberId}:`, error);
      return null;
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
    
    // Detectar mudanças de status da conversa baseadas em tags
    await this.detectAndUpdateConversationStatusFromTags(subscriber, account);
  }
  
  // Detectar e atualizar status da conversa baseado em tags
  private async detectAndUpdateConversationStatusFromTags(subscriber: BotConversaSubscriber, account: 'SUPORTE' | 'COMERCIAL'): Promise<void> {
    try {
      // Buscar conversa existente
      const conversations = await storage.getConversations();
      const existingConversation = conversations.find(conv => 
        conv.customerPhone === subscriber.phone
      );
      
      if (existingConversation) {
        // Mapeamento de tags para status de conversa
        const tagToConversationStatus = {
          'conversa_ativa': 'active',
          'conversa_concluida': 'closed',
          'conversa_pendente': 'pending',
          'atendimento_finalizado': 'closed',
          'aguardando_cliente': 'pending',
          'em_atendimento': 'active'
        };
        
        const tags = subscriber.tags || [];
        let newStatus = null;
        
        // Procurar por tags que correspondem aos status de conversa
        for (const tag of tags) {
          if (tagToConversationStatus[tag]) {
            newStatus = tagToConversationStatus[tag];
            break;
          }
        }
        
        // Atualizar status da conversa se mudou
        if (newStatus && existingConversation.status !== newStatus) {
          await storage.updateConversation(existingConversation.id, {
            status: newStatus
          });
          
          console.log(`Status da conversa atualizado via webhook: ${existingConversation.id} → ${newStatus} (${account})`);
        }
      }
    } catch (error) {
      console.error('Erro ao detectar mudanças de status da conversa:', error);
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
    
    // Detectar manager atribuído ao subscriber
    const assignedManager = await this.detectAssignedManager(subscriber, account);
    
    if (existingConversation) {
      // Atualizar informações do manager se mudou
      if (assignedManager && (
        existingConversation.botconversaManagerId !== assignedManager.id ||
        existingConversation.botconversaManagerName !== assignedManager.full_name
      )) {
        await storage.updateConversation(existingConversation.id, {
          botconversaManagerId: assignedManager.id,
          botconversaManagerName: assignedManager.full_name,
          botconversaManagerEmail: assignedManager.email
        });
        
        console.log(`Manager atualizado para conversa ${existingConversation.id}: ${assignedManager.full_name}`);
      }
      return existingConversation;
    }
    
    // Extrair nome do subscriber com múltiplas tentativas
    let customerName = this.extractCustomerName(subscriber);
    
    // Buscar ou criar lead primeiro
    const leads = await storage.getLeads({ teamId: account === 'COMERCIAL' ? 2 : 1 });
    let lead = leads.find(l => l.phone === subscriber.phone);
    
    if (!lead) {
      // Criar lead se não existir
      const newLead: InsertLead = {
        name: customerName,
        phone: subscriber.phone,
        email: subscriber.email || null,
        source: `BotConversa ${account}`,
        status: 'new',
        companyAccount: account,
        teamId: account === 'COMERCIAL' ? 2 : 1,
        assignedTo: null
      };
      
      lead = await storage.createLead(newLead);
    } else {
      // Atualizar nome do lead se temos um nome melhor
      if (customerName !== 'Contato sem nome' && (!lead.name || lead.name === 'Contato sem nome')) {
        await storage.updateLead(lead.id, { name: customerName });
        lead.name = customerName;
      }
    }
    
    // Criar nova conversa com informações do manager
    const newConversation: InsertConversation = {
      leadId: lead.id,
      attendantId: null,
      status: 'active'
    };
    
    const conversation = await storage.createConversation(newConversation);
    
    // Atualizar com informações do cliente e manager
    const updateData: any = {
      customerName: customerName,
      customerPhone: subscriber.phone,
      companyAccount: account // Adicionar identificação da companhia
    };
    
    if (assignedManager) {
      updateData.botconversaManagerId = assignedManager.id;
      updateData.botconversaManagerName = assignedManager.full_name;
      updateData.botconversaManagerEmail = assignedManager.email;
      
      console.log(`Manager atribuído à nova conversa: ${assignedManager.full_name}`);
    }
    
    await storage.updateConversation(conversation.id, updateData);
    
    return { ...conversation, ...updateData };
  }
  
  // Extrair nome do cliente de diferentes fontes
  private extractCustomerName(subscriber: BotConversaSubscriber): string {
    // 1. Tentar campo 'name' diretamente
    if (subscriber.name && subscriber.name.trim() && subscriber.name.trim() !== '') {
      return subscriber.name.trim();
    }
    
    // 2. Tentar campos estruturados da API BotConversa
    if ((subscriber as any).full_name && (subscriber as any).full_name.trim() !== '') {
      return (subscriber as any).full_name.trim();
    }
    
    // 3. Combinar first_name e last_name
    const firstName = (subscriber as any).first_name;
    const lastName = (subscriber as any).last_name;
    if (firstName && firstName.trim() !== '') {
      let fullName = firstName.trim();
      if (lastName && lastName.trim() !== '') {
        fullName += ' ' + lastName.trim();
      }
      return fullName;
    }
    
    // 4. Tentar campos personalizados comuns
    if (subscriber.custom_fields) {
      const nameFields = ['nome', 'name', 'cliente', 'customer', 'full_name', 'nome_completo', 'first_name', 'primeiro_nome'];
      for (const field of nameFields) {
        if (subscriber.custom_fields[field] && typeof subscriber.custom_fields[field] === 'string') {
          const nameValue = subscriber.custom_fields[field].trim();
          if (nameValue && nameValue !== '') {
            return nameValue;
          }
        }
      }
    }
    
    // 5. Tentar variáveis do BotConversa
    if ((subscriber as any).variables) {
      const variables = (subscriber as any).variables;
      const variableNameFields = ['nome', 'name', 'cliente', 'customer', 'full_name', 'nome_completo', 'first_name', 'primeiro_nome'];
      for (const field of variableNameFields) {
        if (variables[field] && typeof variables[field] === 'string') {
          const nameValue = variables[field].trim();
          if (nameValue && nameValue !== '') {
            return nameValue;
          }
        }
      }
    }
    
    // 6. Tentar extrair nome do telefone formatado (última tentativa)
    if (subscriber.phone) {
      const phoneDigits = subscriber.phone.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        return `Cliente ${phoneDigits.slice(-4)}`;
      }
    }
    
    return 'Contato sem nome';
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