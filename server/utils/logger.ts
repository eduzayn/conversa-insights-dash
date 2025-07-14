// Sistema de logging para produção
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    } else {
      // Em produção, log apenas erros críticos sem dados sensíveis
      console.error(`[ERROR] ${message}`, error?.message || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  // Para logs de produção específicos
  production: (message: string, data?: any) => {
    console.log(`[PROD] ${message}`, data || '');
  }
};