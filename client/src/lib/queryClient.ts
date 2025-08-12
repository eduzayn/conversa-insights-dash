import { QueryClient } from '@tanstack/react-query';

// Sistema robusto de retry com backoff exponencial
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
const MAX_RETRIES = 3;

// Função para determinar se deve tentar novamente
const shouldRetry = (error: any, attemptIndex: number): boolean => {
  if (attemptIndex >= MAX_RETRIES) return false;
  
  // Não tentar novamente para erros 4xx exceto 401 e 429
  if (error.status >= 400 && error.status < 500) {
    return error.status === 401 || error.status === 429;
  }
  
  // Tentar novamente para erros 5xx e problemas de rede
  return true;
};

// Sistema de renovação de token robusto
const refreshToken = async (url: string): Promise<string | null> => {
  try {
    const adminToken = localStorage.getItem('token');
    const professorToken = localStorage.getItem('professor_token');
    const studentToken = localStorage.getItem('student_token');
    
    let currentToken = adminToken;
    if (url.includes('/professor/')) {
      currentToken = professorToken;
    } else if (url.includes('/portal/aluno/')) {
      currentToken = studentToken;
    }
    
    if (!currentToken) return null;
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        // Salvar novo token no local storage apropriado
        if (url.includes('/professor/')) {
          localStorage.setItem('professor_token', data.token);
        } else if (url.includes('/portal/aluno/')) {
          localStorage.setItem('student_token', data.token);
        } else {
          localStorage.setItem('token', data.token);
        }
        return data.token;
      }
    }
  } catch (error) {
    console.warn('[AUTH] Falha ao renovar token:', error);
  }
  
  return null;
};

// Fetcher robusto com retry automático e renovação de token
const robustQueryFn = async ({ queryKey }: { queryKey: readonly string[] }) => {
  const url = queryKey[0];
  let lastError: any;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Sistema de autenticação multi-token
      const adminToken = localStorage.getItem('token');
      const professorToken = localStorage.getItem('professor_token');
      const studentToken = localStorage.getItem('student_token');
      
      let authToken = adminToken;
      if (url.includes('/professor/') || url.includes('professor-login')) {
        authToken = professorToken;
      } else if (url.includes('/portal/aluno/') || url.includes('student-login')) {
        authToken = studentToken;
      }
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      };

      const response = await fetch(url, config);
      
      // Tratamento especial para erro 401 - tentar renovar token
      if (response.status === 401 && attempt === 0) {
        const newToken = await refreshToken(url);
        if (newToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`
          };
          
          const retryResponse = await fetch(url, config);
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      }
      
      if (response.ok) {
        return response.json();
      }
      
      const errorData = await response.json().catch(() => ({ 
        message: `Erro HTTP ${response.status}` 
      }));
      
      const error = new Error(errorData.message || `Erro HTTP ${response.status}`) as any;
      error.status = response.status;
      error.code = errorData.code;
      
      lastError = error;
      
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Aguardar antes da próxima tentativa
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error: any) {
      lastError = error;
      
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// QueryClient com configurações robustas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: robustQueryFn,
      retry: false, // Usamos nosso próprio sistema de retry
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 5 * 60 * 1000, // 5 minutos em cache
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (failureCount >= 2) return false;
        return error?.status >= 500 || error?.name === 'NetworkError';
      },
      networkMode: 'offlineFirst',
    },
  },
});

export { queryClient };

// Helper robusto para API requests com retry automático
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Sistema de autenticação multi-token
      const adminToken = localStorage.getItem('token');
      const professorToken = localStorage.getItem('professor_token');
      const studentToken = localStorage.getItem('student_token');
      
      let authToken = adminToken;
      if (url.includes('/professor/') || url.includes('professor-login')) {
        authToken = professorToken;
      } else if (url.includes('/portal/aluno/') || url.includes('student-login')) {
        authToken = studentToken;
      }
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...(options.headers || {}),
        },
      };

      const response = await fetch(url, config);
      
      // Tratamento especial para 401 - renovar token
      if (response.status === 401 && attempt === 0) {
        const newToken = await refreshToken(url);
        if (newToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`
          };
          
          const retryResponse = await fetch(url, config);
          if (retryResponse.ok) {
            const contentType = retryResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return retryResponse.json();
            }
            return retryResponse.text();
          }
        }
      }
      
      if (response.ok) {
        // Para status 204 (No Content), retornar objeto vazio
        if (response.status === 204) {
          return {};
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        }
        return response.text();
      }
      
      const errorData = await response.json().catch(() => ({ 
        message: `Erro HTTP ${response.status}` 
      }));
      
      const error = new Error(errorData.message || `Erro HTTP ${response.status}`) as any;
      error.status = response.status;
      error.code = errorData.code;
      
      lastError = error;
      
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error: any) {
      lastError = error;
      
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Utilitário para limpar caches
export const clearApiCache = () => {
  queryClient.clear();
  console.log('[API] Cache limpo com sucesso');
};

// Helper para invalidar queries específicas
export const invalidateQueries = (queryKeys: string[]) => {
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};