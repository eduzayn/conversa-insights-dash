import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/clientLogger'

// Sistema otimizado de limpeza DOM
const cleanupDOM = () => {
  try {
    // Preservar tokens essenciais
    const essentialKeys = ['token', 'student_token', 'professor_token', 'user-session'];
    const backup: Record<string, string> = {};
    
    essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value !== 'undefined' && value !== 'null') {
        backup[key] = value;
      }
    });
    
    // Limpar apenas elementos Radix UI problemáticos
    document.querySelectorAll('[data-radix-portal]:empty, [data-sonner-toaster]:empty').forEach(el => {
      try { 
        if (!el.hasChildNodes()) el.remove(); 
      } catch {}
    });
    
    // Restaurar tokens válidos
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  } catch (error) {
    console.debug('DOM cleanup minor issue:', error);
  }
};

// Sistema de proteção DOM otimizado
const setupDOMProtection = () => {
  // Interceptar erros DOM específicos sem afetar performance
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    const suppressedErrors = [
      'removechild', 'appendchild', 'notfounderror', 
      'workspace_iframe', 'allowfullscreen', 'navigation-override',
      'legacy-image-formats', 'oversized-images'
    ];
    
    if (suppressedErrors.some(err => message.includes(err))) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Suprimir warnings CSS específicos do console
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ').toLowerCase();
    const suppressedWarnings = [
      'unrecognize workspace_iframe', 'allowfullscreen', 
      'navigation-override', 'legacy-image-formats'
    ];
    
    if (!suppressedWarnings.some(warn => message.includes(warn))) {
      originalWarn.apply(console, args);
    }
  };
};

// Sistema PWA adequado para resolver beforeinstallprompt
const setupPWA = () => {
  let deferredPrompt: any = null;
  
  // Capturar evento beforeinstallprompt sem preventDefault automático
  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // NÃO chamar e.preventDefault() aqui resolve o erro do console
    console.log('PWA install prompt available');
  });
  
  // Registrar service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW registration failed:', err));
    });
  }
};

// Inicializar sistemas
cleanupDOM();
setupDOMProtection();
setupPWA();

// Monitor silencioso
setInterval(() => {
  const orphanedElements = document.querySelectorAll('[data-radix-portal]:empty, [data-sonner-toaster]:empty');
  if (orphanedElements.length > 3) {
    orphanedElements.forEach(el => { try { el.remove(); } catch {} });
  }
}, 30000);

createRoot(document.getElementById("root")!).render(<App />);
