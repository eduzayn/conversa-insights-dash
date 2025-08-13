import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/clientLogger'
import { suppressWorkspaceErrors, cleanupProblematicIframes, preventIframeSandboxErrors } from './utils/domUtils'

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

// Sistema de proteção DOM mais robusto
const setupDOMProtection = () => {
  // Interceptar todos os erros relacionados a iframe e DOM
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    const filename = event.filename?.toLowerCase() || '';
    
    // Lista expandida de erros para suprimir
    const suppressedErrors = [
      'workspace_iframe', 'allowfullscreen', 'navigation-override',
      'unoptimized-images', 'unsized-media', 'legacy-image-formats',
      'oversized-images', 'allowpaymentrequest', 'sandbox',
      'chrome-error', 'x-frame-options', 'sameorigin'
    ];
    
    if (suppressedErrors.some(err => message.includes(err)) || 
        filename.includes('workspace_iframe') ||
        filename.includes('chrome-error')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Suprimir warnings e erros do console que quebram a aplicação
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ').toLowerCase();
    const suppressedErrors = [
      'workspace_iframe', 'sandbox', 'allowfullscreen',
      'chrome-error', 'x-frame-options', 'unoptimized-images'
    ];
    
    if (!suppressedErrors.some(err => message.includes(err))) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ').toLowerCase();
    const suppressedWarnings = [
      'workspace_iframe', 'allowfullscreen', 'navigation-override',
      'legacy-image-formats', 'unoptimized-images', 'unsized-media'
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

// Inicializar sistemas de proteção
cleanupDOM();
setupDOMProtection();
setupPWA();

// Proteções específicas para workspace_iframe
suppressWorkspaceErrors();
preventIframeSandboxErrors();
cleanupProblematicIframes();

// Monitor silencioso
setInterval(() => {
  const orphanedElements = document.querySelectorAll('[data-radix-portal]:empty, [data-sonner-toaster]:empty');
  if (orphanedElements.length > 3) {
    orphanedElements.forEach(el => { try { el.remove(); } catch {} });
  }
}, 30000);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
