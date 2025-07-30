// Interceptador de console para produção - previne logs desnecessários
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Salvar referências originais
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  // Padrões de logs para filtrar em produção
  const filterPatterns = [
    /websocket/i,
    /socket\.io/i,
    /circular/i,
    /symbol/i,
    /buffer/i,
    /pending/i,
    /keep.*alive/i,
    /tlsWrite/i,
    /tlsRead/i,
    /timeout.*0/i,
    /parser.*null/i,
    /server.*null/i,
    /requestCert.*true/i,
    /httpMessage.*null/i,
    /sockname.*null/i,
    /pendingData.*null/i,
    /pendingEncoding/i,
    /_server.*undefined/i,
    /lastBuffer.*false/i,
    /verified.*true/i,
    /pendingSession.*null/i,
    /kBufferCb.*null/i,
    /keepAliveInitialDelayMillis.*0/i
  ];

  // Função para verificar se deve filtrar o log
  const shouldFilter = (message: string): boolean => {
    return filterPatterns.some(pattern => pattern.test(message));
  };

  // Interceptar console.log
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message)) {
      originalConsole.log(...args);
    }
  };

  // Interceptar console.debug (sempre filtrar em produção)
  console.debug = (...args: any[]) => {
    // Debug nunca aparece em produção
  };

  // Interceptar console.info
  console.info = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message) && (message.includes('[SYSTEM]') || message.includes('[PROD]'))) {
      originalConsole.info(...args);
    }
  };

  // Interceptar console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilter(message) && (message.includes('Auth') || message.includes('Database') || message.includes('[WARN]'))) {
      originalConsole.warn(...args);
    }
  };

  // Console.error sempre passa (mas sanitizado)
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return arg.replace(/Token.*?["\s]/g, 'Token [REDACTED] ')
                 .replace(/password.*?["\s]/g, 'password [REDACTED] ')
                 .replace(/jwt.*?["\s]/g, 'jwt [REDACTED] ')
                 .replace(/bearer.*?["\s]/g, 'bearer [REDACTED] ');
      }
      return arg;
    });
    originalConsole.error(...sanitizedArgs);
  };
}

export {};