// Utilitário para limpeza de cache e estado problemático do navegador
export const performBrowserCleanup = () => {
  try {
    // Limpa localStorage relacionado a temas e estados que podem causar conflitos
    const keysToRemove = [
      'theme',
      'next-themes',
      'sonner-toasts',
      'radix-toast',
      'ui-theme',
      'vite-ui-theme'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Erro ao limpar ${key}:`, e);
      }
    });

    // Limpa elementos DOM órfãos que podem estar causando problemas
    cleanupOrphanedElements();
    
    console.log('Limpeza de cache e estado do navegador concluída');
  } catch (error) {
    console.warn('Erro durante limpeza do navegador:', error);
  }
};

export const cleanupOrphanedElements = () => {
  try {
    // Remove portais Radix órfãos
    const radixPortals = document.querySelectorAll('[data-radix-portal]');
    radixPortals.forEach(portal => {
      if (!portal.hasChildNodes() || !document.body.contains(portal)) {
        portal.remove();
      }
    });

    // Remove toasters órfãos
    const toasters = document.querySelectorAll('[data-sonner-toaster], [data-radix-toast-viewport]');
    toasters.forEach(toaster => {
      if (!document.body.contains(toaster)) {
        toaster.remove();
      }
    });

    // Remove overlays órfãos
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-select-content]');
    overlays.forEach(overlay => {
      if (!document.body.contains(overlay) || overlay.children.length === 0) {
        overlay.remove();
      }
    });

    // Remove elementos com z-index muito altos órfãos
    const highZElements = document.querySelectorAll('[style*="z-index"]');
    highZElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const zIndex = parseInt(style.zIndex);
      if (zIndex > 1000 && !document.body.contains(element)) {
        element.remove();
      }
    });
  } catch (error) {
    console.warn('Erro ao limpar elementos órfãos:', error);
  }
};

// Função para recriar toasters limpos
export const recreateToasters = () => {
  try {
    // Remove toasters existentes
    const existingToasters = document.querySelectorAll('[data-sonner-toaster], [data-radix-toast-viewport]');
    existingToasters.forEach(toaster => toaster.remove());
    
    // Força uma nova renderização dos toasters através de um evento customizado
    window.dispatchEvent(new CustomEvent('recreate-toasters'));
  } catch (error) {
    console.warn('Erro ao recriar toasters:', error);
  }
};

// Sistema de recuperação automática para erros de DOM
export const setupAutoRecovery = () => {
  let errorCount = 0;
  const maxErrors = 3;
  
  window.addEventListener('error', (event) => {
    if (event.error?.name === 'NotFoundError' && 
        event.error?.message?.includes('removeChild')) {
      errorCount++;
      
      if (errorCount >= maxErrors) {
        console.warn('Múltiplos erros DOM detectados, executando limpeza automática...');
        performBrowserCleanup();
        errorCount = 0; // Reset contador
      }
    }
  });
  
  // Reset contador a cada 2 minutos
  setInterval(() => {
    errorCount = 0;
  }, 120000);
};