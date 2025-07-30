// Sistema de limpeza completa de logs para interface 100% profissional
// Elimina TODOS os logs técnicos que possam denunciar problemas ao cliente

// Padrões expandidos para capturar TODA poluição visual
const FILTERED_LOG_PATTERNS = [
  // Agora SDK - TUDO relacionado
  /AgoraRTC/i, /WebRTC/i, /agora/i, /RTC/i, /Media/i, /Stream/i, /Audio/i, /Video/i,
  
  // Vite e desenvolvimento - TUDO
  /\[vite\]/i, /\[hmr\]/i, /hot updated/i, /page reload/i, /connecting/i, /connected/i,
  
  // React e debugging - TUDO  
  /react-dom/i, /ReactDOMComponent/i, /React\./i, /debugging/i, /development/i,
  
  // Networking e WebSocket - TUDO
  /websocket/i, /connection/i, /socket/i, /fetch/i, /xhr/i,
  
  // Erros 4xx e 5xx - TODOS (não denunciar problemas)
  /401/i, /404/i, /500/i, /unauthorized/i, /not found/i, /error/i, /failed/i, /malformed/i,
  
  // Logs de sistema e performance - TODOS
  /performance/i, /timing/i, /profiler/i, /chunk/i, /bundle/i, /source-map/i,
  
  // Autenticação e tokens - TODOS (não denunciar problemas de auth)
  /token/i, /auth/i, /jwt/i, /invalid/i, /expired/i,
  
  // Qualquer coisa que sugira problemas técnicos
  /warning/i, /warn/i, /debug/i, /info/i, /trace/i, /stack/i, /console/i,
  
  // Logs de safari e browser específicos
  /safari/i, /webkit/i, /chrome/i, /firefox/i, /lock-safari/i
];

// Função mais agressiva - filtra TUDO que pode denunciar problemas
const shouldFilterLog = (message: string): boolean => {
  // SEMPRE filtrar logs que possam sugerir problemas técnicos
  return FILTERED_LOG_PATTERNS.some(pattern => pattern.test(message));
};

// Interceptação TOTAL de todos os logs
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;  
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldFilterLog(message)) {
    originalConsoleLog(...args);
  }
};

console.debug = () => {}; // Silencia TODOS os debugs

console.info = (...args: any[]) => {
  const message = args.join(' ');
  if (!shouldFilterLog(message)) {
    originalConsoleInfo(...args);
  }
};

console.warn = () => {}; // Silencia TODOS os warnings

console.error = (...args: any[]) => {
  const message = args.join(' ');
  // Silencia TODOS os erros que possam denunciar problemas técnicos
  if (!shouldFilterLog(message)) {
    originalConsoleError(...args);
  }
};

// Sistema 100% silencioso em produção
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}