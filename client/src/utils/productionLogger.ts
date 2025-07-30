// Sistema de limpeza definitiva de logs visuais - silencia TUDO que polui a interface
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Aplicar limpeza TANTO em produção quanto desenvolvimento para interface 100% limpa
if (isProduction || isDevelopment) {
  // Salvar referências originais
  const originalConsoleLog = console.log;
  const originalConsoleDebug = console.debug;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Lista DEFINITIVA de padrões para filtrar - ZERO tolerância com poluição visual
  const FILTERED_PATTERNS = [
    'Agora-SDK',
    'vite',
    '[hmr]',
    'device-check',
    'browser ua',
    'browser info',
    'browser compatibility',
    'Browserslist:',
    'caniuse-lite',
    'connection lost',
    'hot updated',
    'page reload',
    'connecting...',
    'connected.',
    'server connection lost',
    'Polling for restart',
    'lock-safari',
    'current web page is',
    'Correção robusta',
    'DOM-PROTECTION',
    'MONITOR',
    'Limpeza',
    'CERTIFICAÇÕES',
    'Tentativa',
    'Erro:',
    'error:',
    'warn:',
    'debug:',
    'ERROR:',
    'WARNING:',
    'DEBUG:',
    'Reloading',
    'HMR',
    'polling',
    'restart',
    'Server connection'
  ];
  
  // Função para verificar se deve filtrar
  const shouldFilter = (message: string) => {
    return FILTERED_PATTERNS.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  };
  
  // Interceptar console.log
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  // Interceptar console.debug
  console.debug = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalConsoleDebug.apply(console, args);
    }
  };
  
  // Interceptar console.info
  console.info = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalConsoleInfo.apply(console, args);
    }
  };
  
  // Interceptar console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // Interceptar console.error - suprimir erros de 404 para rotas inexistentes
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('404 Error: User attempted to access non-existent route') ||
        message.includes('Failed to reload') ||
        shouldFilter(message)) {
      return; // Suprimir completamente
    }
    originalConsoleError.apply(console, args);
  };
}

// Sistema limpo - sem logs visuais desnecessários
const shouldSuppressInDev = (message: string) => {
  const suppressPatterns = [
    'Agora-SDK',
    'browser ua',
    'browser info', 
    'browser compatibility',
    'device-check',
    'vite',
    'connecting...',
    'connected.',
    'connection lost',
    'server connection lost',
    'Polling for restart',
    'lock-safari',
    'current web page is',
    'Correção robusta',
    'DOM-PROTECTION',
    'MONITOR',
    'Limpeza',
    'CERTIFICAÇÕES',
    'Tentativa',
    'Erro:',
    'error:',
    'warn:',
    'debug:'
  ];
  
  return suppressPatterns.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  );
};

if (isDevelopment) {
  // Interceptar logs mesmo em desenvolvimento para manter interface limpa
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalInfo = console.info;
  
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressInDev(message)) {
      originalLog.apply(console, args);
    }
  };
  
  console.debug = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressInDev(message)) {
      originalDebug.apply(console, args);
    }
  };
  
  console.info = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressInDev(message)) {
      originalInfo.apply(console, args);
    }
  };
}

export default {};