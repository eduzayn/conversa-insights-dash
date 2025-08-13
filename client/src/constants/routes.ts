// Centralização de rotas para evitar typos e facilitar manutenção
export const ROUTES = {
  // Auth
  HOME: '/',
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  REGISTER: '/register',
  STUDENT_LOGIN: '/portal-aluno/login',
  PROFESSOR_LOGIN: '/professor/login',
  
  // Admin Core
  ADMIN: '/admin',
  DASHBOARD: '/',
  
  // Admin Operations
  ATENDIMENTOS: '/atendimentos',
  ATENDIMENTO_ALUNO: '/atendimento-aluno',
  CHAT_INTERNO: '/chat-interno',
  CRM: '/crm',
  PRESENCA: '/presenca',
  PRODUTIVIDADE: '/produtividade',
  METAS: '/metas',
  
  // Admin Academic
  CERTIFICACOES: '/admin/certificacoes',
  CERTIFICACOES_ALT: '/certificacoes',
  CERTIFICACOES_ACADEMIC: '/admin/academic/certifications',
  CERTIFICADOS_POS: '/certificados-pos',
  CERTIFICADOS_ACADEMICOS: '/certificados-academicos',
  MATRICULA_SIMPLIFICADA: '/matricula-simplificada',
  MATRIZES_CURRICULARES: '/matrizes-curriculares',
  GESTAO_CURSOS: '/gestao-cursos',
  GESTAO_ACADEMICA: '/gestao-academica',
  
  // Admin Reports
  CERTIFICACOES_FADYC: '/certificacoes-fadyc',
  CERTIFICACOES_FADYC_ADMIN: '/admin/reports/certificacoes-fadyc',
  ENVIOS_UNICV: '/envios-unicv',
  ENVIOS_FAMAR: '/envios-famar',
  NEGOCIACOES: '/negociacoes',
  
  // Admin Financial
  CHARGES: '/charges',
  COBRANCAS: '/cobrancas',
  
  // Admin Settings
  GERENCIAMENTO_ROTEAMENTO: '/gerenciamento-roteamento',
  GERENCIAR_TOKENS: '/gerenciar-tokens',
  
  // Admin Integrations
  INTEGRACAO_ASAAS: '/integracao-asaas',
  
  // Portals
  PORTAL_WILDCARD: '/portal/*',
  PROFESSOR_WILDCARD: '/professor/*',
  PROFESSOR_LOGIN_ALT: '/professor-login',
  
  // 404
  NOT_FOUND: '*'
} as const;