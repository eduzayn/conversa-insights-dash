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
      'vite-ui-theme',
      'certificacoes-state',
      'form-state',
      'modal-state',
      'auth-state',
      'query-cache',
      'react-query'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Erro ao limpar ${key}:`, e);
      }
    });

    // Limpa cache de queries React Query
    clearReactQueryCache();

    // Limpa elementos DOM órfãos que podem estar causando problemas
    cleanupOrphanedElements();

    // Força limpeza de cache do navegador
    clearBrowserCache();
    
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

// Função para limpar cache do React Query
export const clearReactQueryCache = () => {
  try {
    // Tenta acessar o queryClient global se estiver disponível
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      (window as any).queryClient.clear();
      console.log('Cache React Query limpo');
    }
    
    // Força limpeza de dados em memória relacionados a queries
    if (typeof window !== 'undefined') {
      // Remove dados de cache do window
      delete (window as any).__REACT_QUERY_STATE__;
      delete (window as any).__TANSTACK_QUERY_STATE__;
    }
  } catch (error) {
    console.warn('Erro ao limpar cache React Query:', error);
  }
};

// Função para forçar limpeza de cache do navegador
export const clearBrowserCache = () => {
  try {
    // Limpa cache de recursos se Service Worker estiver disponível
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Força reload sem cache para recursos críticos
    if (typeof window !== 'undefined') {
      // Remove cache de módulos ES6
      delete (window as any).__vite__;
      delete (window as any).__vite_hmr__;
      
      // Limpa cache de assets
      const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
      links.forEach(link => {
        if (link instanceof HTMLLinkElement && link.href) {
          link.href = link.href.split('?')[0] + '?v=' + Date.now();
        }
        if (link instanceof HTMLScriptElement && link.src) {
          link.src = link.src.split('?')[0] + '?v=' + Date.now();
        }
      });
    }

    console.log('Cache do navegador limpo');
  } catch (error) {
    console.warn('Erro ao limpar cache do navegador:', error);
  }
};

// Função específica para problemas com certificações
export const clearCertificationsCache = () => {
  try {
    // Remove dados específicos de certificações
    const certificationKeys = [
      'certificacoes-filters',
      'certificacoes-pagination',
      'certificacoes-search',
      'certificacoes-modal-state',
      'form-certificacao-state'
    ];
    
    certificationKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Limpa elementos DOM específicos de certificações
    const certificationElements = document.querySelectorAll('[data-certification-modal], [data-cert-form]');
    certificationElements.forEach(element => {
      element.remove();
    });

    // Remove overlays e portals órfãos específicos
    const orphanedOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-portal]');
    orphanedOverlays.forEach(element => {
      if (element.textContent?.includes('certificação') || element.textContent?.includes('Certificação')) {
        element.remove();
      }
    });

    // Força reset de formulários de certificação
    const forms = document.querySelectorAll('form[data-certification-form], form');
    forms.forEach(form => {
      try {
        (form as HTMLFormElement).reset();
      } catch (e) {
        // Ignora erros de formulários que não podem ser resetados
      }
    });

    // Remove estado problemático do React Query específico de certificações
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      try {
        (window as any).queryClient.invalidateQueries({ queryKey: ['certificacoes'] });
        (window as any).queryClient.invalidateQueries({ queryKey: ['/api/certifications'] });
      } catch (e) {
        console.warn('Erro ao invalidar queries de certificações:', e);
      }
    }

    console.log('Cache específico de certificações limpo');
  } catch (error) {
    console.warn('Erro ao limpar cache de certificações:', error);
  }
};

// Função para detectar problemas específicos de certificações
export const detectCertificationProblems = () => {
  const problems = [];
  
  try {
    // Verifica modais órfãos
    const orphanedModals = document.querySelectorAll('[role="dialog"], [data-radix-dialog-content]');
    if (orphanedModals.length > 0) {
      problems.push(`${orphanedModals.length} modais órfãos detectados`);
    }

    // Verifica overlays órfãos
    const orphanedOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    if (orphanedOverlays.length > 0) {
      problems.push(`${orphanedOverlays.length} overlays órfãos detectados`);
    }

    // Verifica formulários em estado inconsistente
    const forms = document.querySelectorAll('form');
    let inconsistentForms = 0;
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      if (inputs.length === 0 && form.innerHTML.trim() === '') {
        inconsistentForms++;
      }
    });
    if (inconsistentForms > 0) {
      problems.push(`${inconsistentForms} formulários em estado inconsistente`);
    }

    // Verifica erros específicos no console (se rastreamento estiver disponível)
    const recentErrors = (console as any)._errors || [];
    const certificationErrors = recentErrors.filter((error: string) => 
      error.includes('certificação') || 
      error.includes('modal') || 
      error.includes('removeChild') ||
      error.includes('dialog')
    );
    if (certificationErrors.length > 0) {
      problems.push(`${certificationErrors.length} erros relacionados a certificações`);
    }

    return problems;
  } catch (error) {
    console.warn('Erro ao detectar problemas de certificações:', error);
    return ['Erro na detecção de problemas'];
  }
};

// Função para diagnóstico completo de problemas
export const performFullSystemDiagnostic = () => {
  const diagnostics = {
    localStorage: {} as Record<string, number>,
    sessionStorage: {} as Record<string, number>,
    domElements: {
      orphanedPortals: 0,
      orphanedToasters: 0,
      orphanedOverlays: 0
    },
    memoryUsage: {} as any,
    errors: [] as string[]
  };

  try {
    // Analisa localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          diagnostics.localStorage[key] = value ? value.length : 0;
        } catch (e) {
          diagnostics.errors.push(`Erro ao ler localStorage ${key}: ${e}`);
        }
      }
    }

    // Analisa sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          const value = sessionStorage.getItem(key);
          diagnostics.sessionStorage[key] = value ? value.length : 0;
        } catch (e) {
          diagnostics.errors.push(`Erro ao ler sessionStorage ${key}: ${e}`);
        }
      }
    }

    // Analisa elementos DOM órfãos
    diagnostics.domElements.orphanedPortals = document.querySelectorAll('[data-radix-portal]').length;
    diagnostics.domElements.orphanedToasters = document.querySelectorAll('[data-sonner-toaster]').length;
    diagnostics.domElements.orphanedOverlays = document.querySelectorAll('[data-radix-dialog-overlay]').length;

    // Analisa uso de memória (se disponível)
    if ('memory' in performance) {
      diagnostics.memoryUsage = (performance as any).memory;
    }

    console.log('📊 Diagnóstico completo do sistema:', diagnostics);
    return diagnostics;
  } catch (error) {
    console.error('Erro durante diagnóstico:', error);
    return diagnostics;
  }
};