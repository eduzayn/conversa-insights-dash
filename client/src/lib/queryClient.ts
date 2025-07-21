import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos em cache
      networkMode: 'online',
    },
  },
});

export { queryClient };

// Helper function for API requests with authentication
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  // Buscar diferentes tipos de token dependendo do contexto
  const adminToken = localStorage.getItem('token');
  const professorToken = localStorage.getItem('professor_token');
  const studentToken = localStorage.getItem('student_token');
  
  // Usar o token apropriado baseado na rota
  let authToken = adminToken;
  if (url.includes('/professor/') || url.includes('professor-login')) {
    authToken = professorToken;
  } else if (url.includes('/portal/aluno/') || url.includes('student-login')) {
    authToken = studentToken;
  }
  
  // Garantir que a URL seja relativa ou aponte para localhost em desenvolvimento
  let requestUrl = url;
  if (url.startsWith('/api')) {
    // URL já está relativa, manter como está
    requestUrl = url;
  } else if (url.includes('replit.app') && import.meta.env.DEV) {
    // Em desenvolvimento, substituir URLs de produção por localhost
    requestUrl = url.replace(/https:\/\/.*\.replit\.app/, '');
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
  };

  const response = await fetch(requestUrl, config);
  
  // Se a resposta não for ok, lançar erro com a mensagem
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(errorData.message || `Erro HTTP ${response.status}`);
  }
  
  // Para status 204 (No Content), retornar objeto vazio em vez de tentar parsear JSON
  if (response.status === 204) {
    return {};
  }
  
  // Processar resposta JSON automaticamente para outros casos
  return response.json();
};