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
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  // Retornar a resposta inteira para que o código cliente possa decidir como processar
  return response;
};