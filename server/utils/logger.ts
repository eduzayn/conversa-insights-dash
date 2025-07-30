// Sistema de logging otimizado para produção
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    } else if (isProduction && message.includes('[SYSTEM]')) {
      // Em produção, só mensagens críticas do sistema
      console.log(`[INFO] ${message}`);
    }
  },

  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    } else {
      // Em produção, sanitizar dados sensíveis
      const sanitizedMessage = message.replace(/Token|password|jwt|bearer/gi, '[REDACTED]');
      console.error(`[ERROR] ${sanitizedMessage}`, error?.message || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    } else if (isProduction && (message.includes('Auth') || message.includes('Database'))) {
      // Em produção, só warnings críticos
      console.warn(`[WARN] ${message}`);
    }
  },

  debug: (message: string, data?: any) => {
    // Debug só em desenvolvimento
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  // Para logs críticos que sempre devem aparecer
  production: (message: string, data?: any) => {
    console.log(`[PROD] ${message}`, data || '');
  }
};