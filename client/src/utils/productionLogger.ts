// Sistema de limpeza de logs para produção
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

if (isProduction) {
  // Salvar referências originais
  const originalConsoleLog = console.log;
  const originalConsoleDebug = console.debug;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Lista de padrões para filtrar
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
    'lock-safari'
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

// Logs para desenvolvimento
if (isDevelopment) {
  console.log('🔧 Modo desenvolvimento - todos os logs habilitados');
}

export default {};