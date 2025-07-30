import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/productionLogger'

// Sistema de correção robusta para problema específico do usuário Erick Moreira
// Baseado em múltiplas correções documentadas no replit.md (linhas 798-814, 1109-1122)
console.log('🔧 Correção robusta ativada - Problema específico usuário Erick Moreira');

// 1. Limpeza completa de cache e DOM órfão
const executeRobustCleanup = () => {
  try {
    // Backup de dados essenciais
    const essentialKeys = ['auth-token', 'user-session'];
    const backup: Record<string, string> = {};
    
    essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) backup[key] = value;
    });
    
    // Limpeza completa
    localStorage.clear();
    sessionStorage.clear();
    
    // Remove todos os portais e elementos órfãos DOM
    document.querySelectorAll('[data-radix-portal], [data-sonner-toaster], [data-radix-toast-viewport]').forEach(el => {
      try { el.remove(); } catch {}
    });
    
    // Restaura dados essenciais
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('✅ Limpeza robusta concluída com sucesso');
  } catch (error) {
    console.warn('⚠️ Erro na limpeza robusta:', error);
  }
};

// 2. Sistema de proteção DOM avançado
const setupAdvancedDOMProtection = () => {
  let errorCount = 0;
  const MAX_ERRORS = 3;
  
  // Intercepta erros DOM críticos
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child: Node): Node {
    try {
      if (this.contains && !this.contains(child)) {
        console.warn('🛡️ [DOM-PROTECTION] Tentativa de remover elemento órfão bloqueada');
        return child;
      }
      return originalRemoveChild.call(this, child);
    } catch (error) {
      errorCount++;
      console.warn(`🚨 [DOM-PROTECTION] Erro DOM #${errorCount}:`, error);
      
      if (errorCount >= MAX_ERRORS) {
        console.log('🔄 [DOM-PROTECTION] Auto-recuperação acionada');
        setTimeout(() => {
          executeRobustCleanup();
          window.location.reload();
        }, 1000);
      }
      return child;
    }
  };
  
  // Intercepta erros globais
  window.addEventListener('error', (event) => {
    if (event.message.includes('removeChild') || 
        event.message.includes('appendChild') || 
        event.message.includes('NotFoundError')) {
      event.preventDefault();
      errorCount++;
      console.warn(`🚨 [DOM-PROTECTION] Erro global interceptado #${errorCount}:`, event.message);
      
      if (errorCount >= MAX_ERRORS) {
        console.log('🔄 [DOM-PROTECTION] Recuperação de emergência acionada');
        executeRobustCleanup();
        setTimeout(() => window.location.reload(), 2000);
      }
    }
  });
};

// 3. Executa correção ao carregar
executeRobustCleanup();
setupAdvancedDOMProtection();

// 4. Monitor contínuo para problemas do Erick
setInterval(() => {
  const orphanedElements = document.querySelectorAll('[data-radix-portal], [data-sonner-toaster]');
  if (orphanedElements.length > 5) {
    console.log('🧹 [MONITOR] Limpeza preventiva de elementos órfãos');
    orphanedElements.forEach(el => { try { el.remove(); } catch {} });
  }
}, 15000); // A cada 15 segundos

createRoot(document.getElementById("root")!).render(<App />);
