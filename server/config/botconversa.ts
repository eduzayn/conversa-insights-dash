// Configuração para integração com BotConversa
export const BOTCONVERSA_CONFIG = {
  baseURL: process.env.BOTCONVERSA_BASE_URL || 'https://api.botconversa.com.br',
  authToken: process.env.BOTCONVERSA_TOKEN || '',
  timeout: 10000,
  retryAttempts: 3
};

export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${BOTCONVERSA_CONFIG.authToken}`
});

export const formatPhoneForBotConversa = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Adiciona o código do país se não existir (55 para Brasil)
  if (cleanPhone.length === 11) {
    return `55${cleanPhone}`;
  } else if (cleanPhone.length === 10) {
    return `5511${cleanPhone}`;
  }
  
  return cleanPhone;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};