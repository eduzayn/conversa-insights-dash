import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/productionLogger'
import { setupDOMErrorHandler, cleanupPortals } from './utils/domErrorHandler'
import { performBrowserCleanup, setupAutoRecovery } from './utils/cacheCleanup'

// Suprimir avisos CSP específicos do Google Drive que não afetam a funcionalidade
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && 
      (message.includes('Refused to frame') || 
       message.includes('Content Security Policy') || 
       message.includes('drive.google.com') ||
       message.includes('accounts.google.com'))) {
    // Silenciar esses avisos específicos do Google Drive
    return;
  }
  originalConsoleError.apply(console, args);
};

// Executa limpeza completa de cache e estado problemático
performBrowserCleanup();

// Configura proteções contra erros de DOM
setupDOMErrorHandler();

// Configura sistema de recuperação automática
setupAutoRecovery();

// Limpa portais órfãos antes de inicializar
cleanupPortals();

// Limpa periodicamente portais órfãos (a cada 30 segundos)
setInterval(cleanupPortals, 30000);

createRoot(document.getElementById("root")!).render(<App />);
