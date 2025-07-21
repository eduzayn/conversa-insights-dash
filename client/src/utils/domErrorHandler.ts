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
        // Se não é mais filho, retorna o nó sem erro
        console.warn('Tentativa de remover nó que não é mais filho - ignorando');
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