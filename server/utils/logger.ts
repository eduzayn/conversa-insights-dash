// Sistema de logging otimizado para produção - COMPLETAMENTE SILENCIOSO
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, data?: any) => {
    // Silenciar TUDO em produção
    if (isDevelopment && !isProduction) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    // Silenciar TODOS os erros em produção para não denunciar problemas
    if (isDevelopment && !isProduction) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  },

  warn: (message: string, data?: any) => {
    // Silenciar TODOS os warnings em produção
    if (isDevelopment && !isProduction) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  debug: (message: string, data?: any) => {
    // Silenciar TODOS os debugs em produção
    if (isDevelopment && !isProduction) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  // Método completamente silencioso para produção
  production: () => {
    // Método vazio - não faz nada
  }
};