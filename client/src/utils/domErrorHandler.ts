// Sistema robusto para tratar erros de manipulação DOM
export const setupDOMErrorHandler = () => {
  // Intercepta erros globais de DOM
  const originalRemoveChild = Node.prototype.removeChild;
  
  (Node.prototype as any).removeChild = function(child: Node): Node {
    try {
      // Verifica se o nó ainda é filho antes de tentar remover
      if (this.contains && this.contains(child)) {
        return originalRemoveChild.call(this, child);
      } else {
        // Se não é mais filho, retorna o nó sem erro (em produção, suprime o log)
        if (process.env.NODE_ENV === 'development') {
          console.warn('Tentativa de remover nó que não é mais filho - ignorando');
        }
        return child;
      }
    } catch (error) {
      console.warn('Erro ao remover nó DOM - ignorando:', error);
      return child;
    }
  };

  // Intercepta erros de appendChild também para prevenir problemas relacionados
  const originalAppendChild = Node.prototype.appendChild;
  
  (Node.prototype as any).appendChild = function(child: Node): Node {
    try {
      return originalAppendChild.call(this, child);
    } catch (error) {
      console.warn('Erro ao adicionar nó DOM - tentando recuperar:', error);
      // Tenta limpar e readicionar
      try {
        if (child.parentNode) {
          child.parentNode.removeChild(child);
        }
        return originalAppendChild.call(this, child);
      } catch (retryError) {
        console.warn('Falha na recuperação de appendChild:', retryError);
        return child;
      }
    }
  };

  // Handler para erros não capturados
  window.addEventListener('error', (event) => {
    if (event.error?.name === 'NotFoundError' && 
        event.error?.message?.includes('removeChild')) {
      console.warn('Erro removeChild capturado e suprimido:', event.error);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });

  // Handler para promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'NotFoundError' && 
        event.reason?.message?.includes('removeChild')) {
      console.warn('Promise rejeitada removeChild capturada e suprimida:', event.reason);
      event.preventDefault();
      return false;
    }
  });
};

export const cleanupPortals = () => {
  // Limpa portais órfãos que podem causar problemas
  const portals = document.querySelectorAll('[data-radix-portal]');
  portals.forEach(portal => {
    try {
      if (!portal.parentNode || portal.childNodes.length === 0) {
        portal.remove();
      }
    } catch (error) {
      console.warn('Erro ao limpar portal:', error);
    }
  });
  
  // Limpa toasters órfãos
  const toasters = document.querySelectorAll('[data-sonner-toaster], [data-radix-toast-viewport]');
  toasters.forEach(toaster => {
    try {
      if (!toaster.parentNode || !document.body.contains(toaster)) {
        toaster.remove();
      }
    } catch (error) {
      console.warn('Erro ao limpar toaster:', error);
    }
  });
};

// Função especializada para limpar componentes Select corrompidos
export const cleanupCorruptedSelects = () => {
  try {
    // Localizar todos os elementos Select com estado potencialmente corrompido
    const selectTriggers = document.querySelectorAll('[data-radix-select-trigger]');
    const selectContents = document.querySelectorAll('[data-radix-select-content]');
    
    // Limpar triggers com estado inconsistente
    selectTriggers.forEach(trigger => {
      try {
        const state = trigger.getAttribute('data-state');
        const ariaExpanded = trigger.getAttribute('aria-expanded');
        
        // Detectar estados inconsistentes
        if ((state === 'open' && ariaExpanded === 'false') || 
            (state === 'closed' && ariaExpanded === 'true')) {
          console.warn('Select com estado inconsistente detectado - corrigindo');
          trigger.setAttribute('data-state', 'closed');
          trigger.setAttribute('aria-expanded', 'false');
        }
        
        // Verificar se há texto concatenado no value (indicador de corrupção)
        const valueElement = trigger.querySelector('[data-radix-select-value]');
        if (valueElement && valueElement.textContent && valueElement.textContent.length > 50) {
          console.warn('Select com conteúdo corrompido detectado - limpando');
          valueElement.textContent = '';
          trigger.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch (error) {
        console.warn('Erro ao corrigir trigger Select:', error);
      }
    });
    
    // Limpar content elements órfãos
    selectContents.forEach(content => {
      try {
        if (!document.body.contains(content) || !content.parentNode) {
          content.remove();
        }
      } catch (error) {
        console.warn('Erro ao remover content Select órfão:', error);
      }
    });
    
    // Forçar re-render de Selects em estado duvidoso
    const allSelects = document.querySelectorAll('button[role="combobox"]');
    allSelects.forEach(select => {
      try {
        const event = new Event('focus');
        select.dispatchEvent(event);
        setTimeout(() => {
          const blurEvent = new Event('blur');
          select.dispatchEvent(blurEvent);
        }, 10);
      } catch (error) {
        console.warn('Erro ao forçar re-render de Select:', error);
      }
    });
    
  } catch (error) {
    console.warn('Erro na limpeza de Selects corrompidos:', error);
  }
};