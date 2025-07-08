// Configurações do BotConversa
export const BOTCONVERSA_CONFIG = {
  // URLs Base
  API_BASE_URL: 'https://backend.botconversa.com.br/api/v1/webhook',
  
  // Chaves de API
  API_KEYS: {
    SUPORTE: process.env.BOTCONVERSA_SUPORTE_KEY || 'e267dba7-1022-4f9f-a36b-b4be4b9a046e',
    COMERCIAL: process.env.BOTCONVERSA_COMERCIAL_KEY || '47c8c187-deb4-45ab-857a-df4af7ba1413'
  },
  
  // Limites de Rate
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 600,
    WEBHOOK_MONTHLY_LIMIT: 10000
  },
  
  // Configurações da Conta Comercial
  COMERCIAL: {
    CUSTOM_FIELDS: {
      // Campos Numéricos
      'AtendimentoOFF': { type: 'number', description: 'Nº de verificações quando atendimento está offline' },
      'Frete': { type: 'number', description: 'Frete: Taxa de entrega' },
      'MelodiaEVTRO': { type: 'number', description: 'Melodia EVTRO' },
      'NotaAPS': { type: 'number', description: 'Nota APS' },
      'NumEntr': { type: 'number', description: 'Número de entrada' },
      'PrecoPortfolioAuaa': { type: 'number', description: 'Preço do portfólio' },
      'ProdutoEscolhido': { type: 'number', description: 'Campo para verificar produto escolhido' },
      'ProdutoSelecionado': { type: 'number', description: 'Produto selecionado' },
      'QualPortfolioAuaa': { type: 'number', description: 'Qual portfolio' },
      'ServicoEscolhido': { type: 'number', description: 'Serviço escolhido' },
      'TotalConfirmado': { type: 'number', description: 'Total confirmado' },
      'ValorDoCaminho': { type: 'number', description: 'Valor do caminho' },
      'valorresarcir': { type: 'number', description: 'Valor a ressarcir' },
      
      // Campos de Texto
      'DataHoraTime': { type: 'text', description: 'Campo com recebe informações de data e hora' },
      'Dialogelengamento': { type: 'text', description: 'Salva o último atendimento' },
      'Era': { type: 'text', description: 'Cronologia completa' },
      'Expediente': { type: 'text', description: 'Determina se horário de atendimento' },
      'ListaPortfolio': { type: 'text', description: 'Campo responsável por armazenar lista de portfólio' },
      'NomeServicoEscolhido': { type: 'text', description: 'Armazena o nome do serviço' },
      'NomeServicoEscolhido(1)': { type: 'text', description: 'Nome do serviço escolhido' },
      'PosicaoAuaa': { type: 'text', description: 'Lista do portfólio' },
      'SugestaoMelhoria': { type: 'text', description: 'Sugestão de melhoria' },
      'TurnoAtendimento': { type: 'text', description: 'Turno de atendimento' },
      'usuarioInformado': { type: 'text', description: 'Campo que salva a cidade' },
      
      // Campos de Data
      'DataMomento': { type: 'datetime', description: 'Data e hora do momento' },
      'Data_a_hora_atual': { type: 'datetime', description: 'Captura a data e hora atual' }
    },
    
    TAGS: [
      'Aguardando dados',
      'Aguardando pagamento', 
      'Análise Certificação Pós',
      'Análise Certificação Segunda',
      'Comercial',
      'Diplomação Música',
      'Diplomação Pedagogia',
      'Indicação',
      'Matriculado',
      'Matrícula Paor',
      'Muito Interesse',
      'Música 2ª Licenciatura',
      'Música Formação Pedagogia',
      'Pedagogia Diplomação',
      'Pedagogia Segunda Licenciatura',
      'Primeira Graduação UNOPAR',
      'Psicanálise Formação Livre',
      'Psicanálise Pós',
      'Pós Graduação',
      'Secretaria 2ª',
      'Secretaria pós',
      'Segunda Graduação Música',
      'Suporte'
    ],
    
    SEQUENCES: [
      { name: 'sequencia1', active: true }
    ],
    
    WEBHOOKS: [
      { name: 'Controle de Atendimento Diário', status: 'teste' }
    ],
    
    // Mapeamento de Tags para Status do CRM
    TAG_TO_STATUS_MAPPING: {
      'Aguardando dados': 'new',
      'Aguardando pagamento': 'proposal',
      'Comercial': 'contacted',
      'Muito Interesse': 'qualified',
      'Matriculado': 'won',
      'Indicação': 'new',
      'Pós Graduação': 'qualified',
      'Primeira Graduação UNOPAR': 'qualified',
      'Suporte': 'contacted'
    }
  }
};

// Headers padrão para requisições
export const BOTCONVERSA_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'BotConversa-Analytics/1.0'
};

// Função para obter headers com autenticação
export const getAuthHeaders = (account: 'SUPORTE' | 'COMERCIAL') => ({
  ...BOTCONVERSA_HEADERS,
  'api-key': BOTCONVERSA_CONFIG.API_KEYS[account]
});

// Função para validar telefone no formato BotConversa
export const validatePhone = (phone: string): boolean => {
  // Formato esperado: DDI+DDD+9+TELEFONE (ex: 5511912341234)
  const phoneRegex = /^55\d{2}9\d{8}$/;
  return phoneRegex.test(phone);
};

// Função para formatar telefone para BotConversa
export const formatPhoneForBotConversa = (phone: string, ddd: string = '11'): string => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se já tem 13 dígitos e começa com 55, retorna como está
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    return cleanPhone;
  }
  
  // Se tem 12 dígitos e começa com 55 (formato sem o 9), adiciona o 9
  if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
    const ddi = cleanPhone.substring(0, 2); // 55
    const dddPhone = cleanPhone.substring(2, 4); // DDD
    const number = cleanPhone.substring(4); // telefone
    return `${ddi}${dddPhone}9${number}`;
  }
  
  // Se tem 11 dígitos (DDD + 9 + telefone), adiciona 55
  if (cleanPhone.length === 11) {
    return `55${cleanPhone}`;
  }
  
  // Se tem 10 dígitos (DDD + telefone sem 9), adiciona 55 e 9
  if (cleanPhone.length === 10) {
    const dddPhone = cleanPhone.substring(0, 2); // DDD
    const number = cleanPhone.substring(2); // telefone
    return `55${dddPhone}9${number}`;
  }
  
  // Se tem 9 dígitos (apenas telefone), adiciona 55 + DDD
  if (cleanPhone.length === 9) {
    return `55${ddd}${cleanPhone}`;
  }
  
  // Se tem 8 dígitos (telefone sem 9), adiciona 55 + DDD + 9
  if (cleanPhone.length === 8) {
    return `55${ddd}9${cleanPhone}`;
  }
  
  throw new Error(`Formato de telefone inválido: ${phone}. Formatos aceitos: 8, 9, 10, 11, 12 ou 13 dígitos`);
};

export default BOTCONVERSA_CONFIG;