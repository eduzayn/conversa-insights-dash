import React from 'react';

// Hook para detectar status de conexão
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Interceptador global para erros de autenticação
export const setupAuthInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Se receber 401, limpar tokens e redirecionar
      if (response.status === 401) {
        const url = args[0] as string;
        
        // Limpar token apropriado
        if (url.includes('/professor/')) {
          localStorage.removeItem('professor_token');
        } else if (url.includes('/portal/aluno/')) {
          localStorage.removeItem('student_token');
        } else {
          localStorage.removeItem('token');
        }
        
        // Redirecionar após pequeno delay
        setTimeout(() => {
          if (url.includes('/professor/')) {
            window.location.href = '/professor/login';
          } else if (url.includes('/portal/aluno/')) {
            window.location.href = '/portal-aluno/login';
          } else {
            window.location.href = '/admin/login';
          }
        }, 1000);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
};

// Configurar interceptador na inicialização do app
if (typeof window !== 'undefined') {
  setupAuthInterceptor();
}