import { BOTCONVERSA_CONFIG } from '../config/botconversa.js';
import { storage } from '../storage.js';
import { BotConversaSubscriber } from './botconversa.js';

export interface RoutingRule {
  tag: string;
  department: string;
  priority: number;
  account: 'COMERCIAL' | 'SUPORTE';
}

export class RoutingService {
  
  /**
   * Determina qual departamento deve receber um subscriber baseado em suas tags
   */
  async routeSubscriber(subscriber: BotConversaSubscriber, account: 'COMERCIAL' | 'SUPORTE'): Promise<string> {
    const config = account === 'COMERCIAL' ? BOTCONVERSA_CONFIG.COMERCIAL : BOTCONVERSA_CONFIG.SUPORTE;
    
    // Verifica se o subscriber tem tags
    if (!subscriber.tags || subscriber.tags.length === 0) {
      return 'COMERCIAL'; // Departamento padrão
    }
    
    // Procura por regras de roteamento baseadas nas tags
    for (const tag of subscriber.tags) {
      const department = config.ROUTING_RULES[tag];
      if (department) {
        console.log(`Roteando subscriber ${subscriber.id} para departamento ${department} baseado na tag: ${tag}`);
        return department;
      }
    }
    
    // Se não encontrou regra específica, usa departamento padrão
    return account === 'COMERCIAL' ? 'COMERCIAL' : 'SUPORTE';
  }
  
  /**
   * Obtém a lista de emails responsáveis por um departamento
   */
  getDepartmentEmails(department: string, account: 'COMERCIAL' | 'SUPORTE'): string[] {
    const config = account === 'COMERCIAL' ? BOTCONVERSA_CONFIG.COMERCIAL : BOTCONVERSA_CONFIG.SUPORTE;
    const dept = config.DEPARTMENTS[department];
    return dept ? dept.emails : [];
  }
  
  /**
   * Obtém estatísticas de departamentos
   */
  getDepartmentStats(account: 'COMERCIAL' | 'SUPORTE') {
    const config = account === 'COMERCIAL' ? BOTCONVERSA_CONFIG.COMERCIAL : BOTCONVERSA_CONFIG.SUPORTE;
    
    const stats = Object.entries(config.DEPARTMENTS).map(([name, dept]) => ({
      name,
      members: dept.members,
      emails: dept.emails.length,
      capacity: dept.members * 10 // Assumindo 10 conversas por membro
    }));
    
    return {
      totalDepartments: stats.length,
      totalMembers: stats.reduce((sum, dept) => sum + dept.members, 0),
      departments: stats
    };
  }
  
  /**
   * Encontra o melhor atendente disponível em um departamento
   */
  async findBestAttendant(department: string, account: 'COMERCIAL' | 'SUPORTE'): Promise<number | null> {
    const emails = this.getDepartmentEmails(department, account);
    
    if (emails.length === 0) {
      return null;
    }
    
    // Procura por usuários no sistema baseado nos emails
    const attendants = [];
    for (const email of emails) {
      const user = await storage.getUserByEmail(email);
      if (user) {
        attendants.push(user);
      }
    }
    
    if (attendants.length === 0) {
      return null;
    }
    
    // Por enquanto, retorna o primeiro atendente encontrado
    // Futuramente pode implementar lógica de carga de trabalho
    return attendants[0].id;
  }
  
  /**
   * Cria regras de roteamento personalizadas
   */
  async createCustomRoutingRule(rule: RoutingRule): Promise<void> {
    // Implementar persistência de regras personalizadas se necessário
    console.log('Regra personalizada criada:', rule);
  }
  
  /**
   * Obtém métricas de roteamento
   */
  async getRoutingMetrics(account: 'COMERCIAL' | 'SUPORTE', period: 'today' | 'week' | 'month' = 'today') {
    // Implementar métricas baseadas no histórico de conversas
    const conversations = await storage.getConversations();
    
    const metrics = {
      totalRouted: conversations.length,
      byDepartment: {} as Record<string, number>,
      responseTime: 0,
      period
    };
    
    return metrics;
  }
}

export const routingService = new RoutingService();