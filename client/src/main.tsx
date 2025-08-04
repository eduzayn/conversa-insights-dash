import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/productionLogger'
import { setupDOMErrorHandler, cleanupPortals } from './utils/domErrorHandler'
import { performBrowserCleanup, setupAutoRecovery } from './utils/cacheCleanup'

// Suprimir avisos CSP específicos do Google Drive que não afetam a funcionalidade
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Função para verificar se é um erro do Google Drive CSP
const isGoogleDriveCSPError = (message: any) => {
  if (typeof message !== 'string') return false;
  return (
    message.includes('Refused to frame') ||
    message.includes('Content Security Policy') ||
    message.includes('drive.google.com') ||
    message.includes('accounts.google.com') ||
    message.includes('frame-ancestors') ||
    message.includes('ancestor violates')
  );
};

console.error = (...args) => {
  if (args.some(arg => isGoogleDriveCSPError(arg))) {
    return; // Silenciar
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  if (args.some(arg => isGoogleDriveCSPError(arg))) {
    return; // Silenciar
  }
  originalConsoleWarn.apply(console, args);
};

// Também suprimir via window.addEventListener para capturar erros do iframe
window.addEventListener('error', (event) => {
  if (isGoogleDriveCSPError(event.message)) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  if (isGoogleDriveCSPError(event.reason)) {
    event.preventDefault();
    return false;
  }
}, true);

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
