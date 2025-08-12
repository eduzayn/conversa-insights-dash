// Utilitários para limpeza e proteção DOM

export const suppressWorkspaceErrors = () => {
  // Interceptar e suprimir erros específicos do workspace
  const originalAddEventListener = Element.prototype.addEventListener;
  
  Element.prototype.addEventListener = function(type: string, listener: any, options?: any) {
    if (this.tagName === 'IFRAME' && 
        (this.getAttribute('src')?.includes('workspace_iframe') || 
         this.getAttribute('data-testid')?.includes('workspace'))) {
      // Não adicionar listeners a iframes problemáticos
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
};

export const cleanupProblematicIframes = () => {
  try {
    // Remover iframes workspace específicos
    const problematicSelectors = [
      'iframe[src*="workspace_iframe"]',
      'iframe[data-testid*="workspace"]',
      '[data-testid*="workspace_frame"]',
      '.workspace-iframe-container'
    ];
    
    problematicSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        try {
          el.remove();
        } catch (error) {
          // Silenciar erros de remoção
        }
      });
    });
  } catch (error) {
    // Silenciar erros
  }
};

export const preventIframeSandboxErrors = () => {
  // Interceptar tentativas de criação de iframes problemáticos
  const originalCreateElement = document.createElement;
  
  (document as any).createElement = function(tagName: string, options?: any): HTMLElement {
    const element = originalCreateElement.call(this, tagName, options);
    
    if (tagName.toLowerCase() === 'iframe') {
      // Adicionar proteções automáticas
      element.addEventListener('error', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      
      // Prevenir sandbox inválidos
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name: string, value: string) {
        if (name === 'sandbox' && 
            (value.includes('allow-downloads-without-user-activation') ||
             value.includes('workspace_iframe'))) {
          // Sanitizar atributos sandbox problemáticos
          value = value
            .replace('allow-downloads-without-user-activation', '')
            .replace(/workspace_iframe[^"'\s]*/g, '')
            .trim();
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
};