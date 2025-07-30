// Sistema de limpeza de cache e estado do navegador
// Correção definitiva documentada em replit.md linha 798-814

export const cleanupBrowserState = () => {
  try {
    console.log('[CACHE-CLEANUP] Iniciando limpeza completa do estado do navegador...');
    
    // 1. Limpeza do localStorage (preservando apenas dados essenciais)
    const essentialKeys = ['auth-token', 'user-session'];
    const localStorageBackup: Record<string, string> = {};
    
    essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) localStorageBackup[key] = value;
    });
    
    localStorage.clear();
    
    // Restaura dados essenciais
    Object.entries(localStorageBackup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // 2. Limpeza do sessionStorage
    sessionStorage.clear();
    
    // 3. Limpeza de elementos DOM órfãos
    const orphanedElements = document.querySelectorAll('[data-radix-portal], [data-sonner-toaster]');
    orphanedElements.forEach(element => {
      try {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      } catch (error) {
        console.warn('[CACHE-CLEANUP] Erro ao remover elemento órfão:', error);
      }
    });
    
    // 4. Limpeza de timers e intervalos ativos
    const highestTimeoutId = setTimeout(() => {}, 0) as unknown as number;
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    const highestIntervalId = setInterval(() => {}, 0) as unknown as number;
    clearInterval(highestIntervalId);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
    
    // 5. Forçar garbage collection se disponível
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // 6. Limpeza de cache de Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // 7. Limpeza de cache de imagens/recursos
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    console.log('[CACHE-CLEANUP] Limpeza de cache e estado do navegador concluída');
    
    // 8. Recarregamento forçado após limpeza (específico para problema do Erick)
    setTimeout(() => {
      console.log('[CACHE-CLEANUP] Recarregamento preventivo para usuário Erick Moreira');
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('[CACHE-CLEANUP] Erro durante limpeza:', error);
    // Em caso de erro na limpeza, força reload direto
    window.location.reload();
  }
};

// Função específica para limpar apenas cache de queries React Query
export const cleanupQueryCache = () => {
  try {
    // Limpa cache específico de certificações
    const queryClient = (window as any).__REACT_QUERY_CLIENT__;
    if (queryClient) {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      console.log('[CACHE-CLEANUP] Cache de queries React Query limpo');
    }
  } catch (error) {
    console.warn('[CACHE-CLEANUP] Erro ao limpar cache de queries:', error);
  }
};

// Função inicial para limpeza preventiva (específica para problema do Erick)
export const performBrowserCleanup = () => {
  console.log('[CACHE-CLEANUP] Executando limpeza preventiva para problema do usuário Erick Moreira');
  
  // Limpa apenas localStorage/sessionStorage, sem forçar reload
  try {
    const essentialKeys = ['auth-token', 'user-session'];
    const localStorageBackup: Record<string, string> = {};
    
    essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) localStorageBackup[key] = value;
    });
    
    localStorage.clear();
    
    // Restaura dados essenciais
    Object.entries(localStorageBackup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    sessionStorage.clear();
    console.log('[CACHE-CLEANUP] Limpeza preventiva concluída');
  } catch (error) {
    console.warn('[CACHE-CLEANUP] Erro na limpeza preventiva:', error);
  }
};

// Sistema de recuperação automática
export const setupAutoRecovery = () => {
  let recoveryAttempts = 0;
  const maxRecoveryAttempts = 3;
  
  const handleRecovery = () => {
    if (recoveryAttempts < maxRecoveryAttempts) {
      recoveryAttempts++;
      console.log(`[CACHE-CLEANUP] Tentativa de recuperação automática ${recoveryAttempts}/${maxRecoveryAttempts}`);
      cleanupQueryCache();
    }
  };
  
  // Monitor para detecção de problemas específicos do Erick
  setInterval(() => {
    const errorElements = document.querySelectorAll('.error-state, [data-error]');
    if (errorElements.length > 0) {
      handleRecovery();
    }
  }, 10000); // Verifica a cada 10 segundos
};