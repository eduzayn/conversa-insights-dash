// Sistema de interceptação de erros DOM específicos
// Baseado na correção definitiva documentada em replit.md linha 798-814

let errorCount = 0;
const MAX_ERRORS = 5;

export const setupDOMErrorHandler = () => {
  // Interceptação de removeChild/appendChild com validação prévia
  const originalRemoveChild = Node.prototype.removeChild;
  const originalAppendChild = Node.prototype.appendChild;

  Node.prototype.removeChild = function(child: Node): Node {
    try {
      // Validação prévia antes de remover
      if (this.contains && !this.contains(child)) {
        console.warn('[DOM-HANDLER] Tentativa de remover elemento não pertencente ao pai:', child);
        return child;
      }
      return originalRemoveChild.call(this, child);
    } catch (error) {
      console.warn('[DOM-HANDLER] Erro interceptado no removeChild:', error);
      errorCount++;
      
      // Se muitos erros, executa limpeza automática
      if (errorCount >= MAX_ERRORS) {
        import('./cacheCleanup').then(({ cleanupBrowserState }) => {
          console.log('[DOM-HANDLER] Executando limpeza automática após múltiplos erros DOM');
          cleanupBrowserState();
          errorCount = 0; // Reset contador
        });
      }
      
      return child;
    }
  };

  Node.prototype.appendChild = function(child: Node): Node {
    try {
      return originalAppendChild.call(this, child);
    } catch (error) {
      console.warn('[DOM-HANDLER] Erro interceptado no appendChild:', error);
      errorCount++;
      
      if (errorCount >= MAX_ERRORS) {
        import('./cacheCleanup').then(({ cleanupBrowserState }) => {
          console.log('[DOM-HANDLER] Executando limpeza automática após múltiplos erros DOM');
          cleanupBrowserState();
          errorCount = 0;
        });
      }
      
      return child;
    }
  };
};

// Limpeza de portais órfãos (específico para problema do Erick)
export const cleanupPortals = () => {
  try {
    const portals = document.querySelectorAll('[data-radix-portal], [data-sonner-toaster]');
    portals.forEach(portal => {
      try {
        if (portal.parentNode) {
          portal.parentNode.removeChild(portal);
        }
      } catch (error) {
        console.warn('[DOM-HANDLER] Erro ao remover portal órfão:', error);
      }
    });
    console.log(`[DOM-HANDLER] ${portals.length} portais órfãos removidos`);
  } catch (error) {
    console.warn('[DOM-HANDLER] Erro na limpeza de portais:', error);
  }
};

// Interceptação de erros globais do navegador
export const setupGlobalErrorHandler = () => {
  window.addEventListener('error', (event) => {
    if (event.message.includes('removeChild') || event.message.includes('appendChild')) {
      console.warn('[DOM-HANDLER] Erro DOM interceptado globalmente:', event.message);
      event.preventDefault(); // Previne que o erro apareça no console
      errorCount++;
      
      if (errorCount >= MAX_ERRORS) {
        import('./cacheCleanup').then(({ cleanupBrowserState }) => {
          console.log('[DOM-HANDLER] Limpeza automática iniciada por erro global');
          cleanupBrowserState();
          errorCount = 0;
        });
      }
    }
  });
};

export const getDOMErrorCount = () => errorCount;
export const resetDOMErrorCount = () => { errorCount = 0; };