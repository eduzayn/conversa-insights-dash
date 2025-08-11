import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/clientLogger'

// Limpeza silenciosa de DOM sem logs visuais
const cleanupDOM = () => {
  try {
    const essentialKeys = ['auth-token', 'user-session'];
    const backup: Record<string, string> = {};
    
    essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) backup[key] = value;
    });
    
    localStorage.clear();
    sessionStorage.clear();
    
    document.querySelectorAll('[data-radix-portal], [data-sonner-toaster], [data-radix-toast-viewport]').forEach(el => {
      try { el.remove(); } catch {}
    });
    
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  } catch (error) {
    // Silenciar erros
  }
};

// Sistema de proteção DOM sem logs
const setupDOMProtection = () => {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    try {
      if (this.contains && !this.contains(child)) {
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      return child;
    }
  };
  
  window.addEventListener('error', (event) => {
    if (event.message.includes('removeChild') || 
        event.message.includes('appendChild') || 
        event.message.includes('NotFoundError')) {
      event.preventDefault();
    }
  });
};

cleanupDOM();
setupDOMProtection();

// Monitor silencioso
setInterval(() => {
  const orphanedElements = document.querySelectorAll('[data-radix-portal], [data-sonner-toaster]');
  if (orphanedElements.length > 5) {
    orphanedElements.forEach(el => { try { el.remove(); } catch {} });
  }
}, 15000);

createRoot(document.getElementById("root")!).render(<App />);
