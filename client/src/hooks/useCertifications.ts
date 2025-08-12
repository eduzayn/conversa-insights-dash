/**
 * Hook customizado para gerenciar todas as operações de certificações
 * 
 * Centraliza toda a lógica de useQuery, useMutation e funções de API
 * para deixar o componente principal mais limpo e organizados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';
import type { Certification } from '@shared/schema';

export const useCertifications = (
  activeTab: string,
  searchTerm: string,
  filterStatus: string,
  filterTipoData: string,
  filterPeriodo: string,
  dataInicio: string,
  dataFim: string,
  currentPage: number,
  pageSize: number
) => {
  const queryClient = useQueryClient();

  // Função auxiliar para obter categoria da aba
  const getCategoriaFromTab = (tab: string) => {
    switch(tab) {
      case 'pos': return 'pos_graduacao';
      case 'segunda': return 'segunda_licenciatura';
      case 'formacao_pedagogica': return 'formacao_pedagogica';
      case 'formacao_livre': return 'formacao_livre';
      case 'diplomacao': return 'diplomacao_competencia';
      case 'eja': return 'eja';
      case 'graduacao': return 'graduacao';
      case 'capacitacao': return 'capacitacao';
      case 'sequencial': return 'sequencial';
      default: return 'pos_graduacao';
    }
  };

  // Função auxiliar para obter range de datas
  const getDateRange = () => {
    const today = new Date();
    
    switch(filterPeriodo) {
      case 'hoje':
        return {
          inicio: new Date(today.setHours(0,0,0,0)).toISOString().split('T')[0],
          fim: new Date(today.setHours(23,59,59,999)).toISOString().split('T')[0]
        };
      case 'semana':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return {
          inicio: startOfWeek.toISOString().split('T')[0],
          fim: endOfWeek.toISOString().split('T')[0]
        };
      case 'mes':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          inicio: startOfMonth.toISOString().split('T')[0],
          fim: endOfMonth.toISOString().split('T')[0]
        };
      case 'mes_passado':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        return {
          inicio: startOfLastMonth.toISOString().split('T')[0],
          fim: endOfLastMonth.toISOString().split('T')[0]
        };
      case 'personalizado':
        return {
          inicio: dataInicio,
          fim: dataFim
        };
      default:
        return null;
    }
  };

  // Query para buscar certificações com cache otimizado
  const { data: certificationsData, isLoading, isFetching, error: certificationsError, refetch } = useQuery({
    queryKey: ['/api/certificacoes', { 
      categoria: getCategoriaFromTab(activeTab),
      status: filterStatus,
      tipoData: filterTipoData,
      periodo: filterPeriodo,
      dataInicio,
      dataFim,
      search: searchTerm,
      page: currentPage,
      limit: pageSize
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        categoria: getCategoriaFromTab(activeTab),
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      
      if (filterStatus && filterStatus !== 'todos') params.append('status', filterStatus);
      if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());
      
      // Adicionar filtros de período
      if (filterPeriodo && filterPeriodo !== 'todos') {
        const dateRange = getDateRange();
        if (dateRange) {
          if (dateRange.inicio) params.append('dataInicio', dateRange.inicio);
          if (dateRange.fim) params.append('dataFim', dateRange.fim);
        }
      }
      
      // Adicionar tipo de data para filtrar
      if (filterTipoData) {
        params.append('tipoData', filterTipoData);
      }
      
      const response = await apiRequest(`/api/certificacoes?${params}`);
      return response;
    },
    staleTime: 60_000,        // 1 min "fresco" - dados permanecem válidos por mais tempo
    gcTime: 5 * 60_000,       // 5 min - mantém no cache por mais tempo
    refetchOnWindowFocus: false, 
    placeholderData: (previousData) => previousData, // Mantém dados anteriores durante fetch para evitar "piscadas"
    retry: (failureCount, error: any) => {
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000)
  });

  // Mutation para criar certificação com optimistic update
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/certificacoes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onMutate: async (newCertification) => {
      // Cancelar queries em andamento
      const queryKey = ['/api/certificacoes', { 
        categoria: getCategoriaFromTab(activeTab),
        status: filterStatus,
        tipoData: filterTipoData,
        periodo: filterPeriodo,
        dataInicio,
        dataFim,
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      }];
      await queryClient.cancelQueries({ queryKey });
      
      // Capturar estado anterior
      const previousData = queryClient.getQueryData(queryKey);
      
      // Atualizar otimisticamente com novo item
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        
        const optimisticCert = {
          ...newCertification,
          id: Date.now(), // ID temporário
          createdAt: new Date().toISOString()
        };
        
        return {
          ...oldData,
          data: [optimisticCert, ...(oldData.data || [])],
          total: (parseInt(oldData.total) || 0) + 1
        };
      });
      
      return { previousData, queryKey };
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('Erro ao criar certificação');
      console.error('Erro:', error);
    },
    onSuccess: () => {
      toast.success('Certificação criada com sucesso!');
    },
    onSettled: () => {
      // Atualizar dados reais do servidor
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
    }
  });

  // Mutation para atualizar certificação com optimistic update
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/certificacoes/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onMutate: async (updatedCertification) => {
      // Cancelar queries em andamento
      const queryKey = ['/api/certificacoes', { 
        categoria: getCategoriaFromTab(activeTab),
        status: filterStatus,
        tipoData: filterTipoData,
        periodo: filterPeriodo,
        dataInicio,
        dataFim,
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      }];
      await queryClient.cancelQueries({ queryKey });
      
      // Capturar estado anterior
      const previousData = queryClient.getQueryData(queryKey);
      
      // Atualizar otimisticamente
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((cert: any) => 
            cert.id === updatedCertification.id 
              ? { ...cert, ...updatedCertification }
              : cert
          )
        };
      });
      
      return { previousData, queryKey };
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('Erro ao atualizar certificação');
      console.error('Erro:', error);
    },
    onSuccess: () => {
      toast.success('Certificação atualizada com sucesso!');
    },
    onSettled: () => {
      // Atualizar dados reais do servidor
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
    }
  });

  // Mutation para excluir certificação com optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/certificacoes/${id}`, {
        method: 'DELETE'
      });
    },
    onMutate: async (deletedId) => {
      // Cancelar queries em andamento
      const queryKey = ['/api/certificacoes', { 
        categoria: getCategoriaFromTab(activeTab),
        status: filterStatus,
        tipoData: filterTipoData,
        periodo: filterPeriodo,
        dataInicio,
        dataFim,
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      }];
      await queryClient.cancelQueries({ queryKey });
      
      // Capturar estado anterior
      const previousData = queryClient.getQueryData(queryKey);
      
      // Remover otimisticamente
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((cert: any) => cert.id !== deletedId),
          total: Math.max(0, (parseInt(oldData.total) || 0) - 1)
        };
      });
      
      return { previousData, queryKey };
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('Erro ao excluir certificação');
      console.error('Erro:', error);
    },
    onSuccess: () => {
      toast.success('Certificação excluída com sucesso!');
    },
    onSettled: () => {
      // Atualizar dados reais do servidor
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
    }
  });

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/pre-registered-courses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pre-registered-courses'] });
      toast.success('Curso criado com sucesso!');
      return newCourse;
    },
    onError: (error) => {
      toast.error('Erro ao criar curso');
      console.error('Erro:', error);
    }
  });

  return {
    // Data
    certificationsData,
    certifications: certificationsData?.data || [],
    totalCertifications: parseInt(certificationsData?.total) || 0,
    totalPages: certificationsData?.totalPages || 1,
    
    // Loading states otimizados para melhor UX
    isLoading: isLoading || isFetching, // Inclui estado de fetching
    isInitialLoading: isLoading, // Apenas loading inicial (sem placeholderData)
    isFetching, // Estado de busca em andamento (para indicadores discretos)
    isPreviousData: !!certificationsData && isFetching, // Indica se está usando dados anteriores
    certificationsError,
    
    // Functions
    refetch,
    getCategoriaFromTab,
    
    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    createCourseMutation
  };
};

// Query para buscar cursos pré-cadastrados (para criação) com cache otimizado
export const usePreRegisteredCourses = (categoria: string) => {
  const { data: preRegisteredCoursesData = [] } = useQuery({
    queryKey: ['/api/pre-registered-courses', { categoria }],
    queryFn: async () => {
      const params = new URLSearchParams({ categoria });
      const response = await apiRequest(`/api/pre-registered-courses?${params}`);
      return response;
    },
    staleTime: 60_000,        // 1 min "fresco" - cursos mudam raramente
    gcTime: 10 * 60_000,      // 10 min - mantém cursos em cache por mais tempo
    placeholderData: (prev) => prev, // Evita "piscadas" ao trocar categoria
    refetchOnWindowFocus: false
  });
  
  return Array.isArray(preRegisteredCoursesData) ? preRegisteredCoursesData : [];
};

// Query para buscar cursos pré-cadastrados (para edição) com cache otimizado
export const useEditPreRegisteredCourses = (categoria?: string, enabled = false) => {
  const { data: editPreRegisteredCoursesData = [] } = useQuery({
    queryKey: ['/api/pre-registered-courses-edit', { categoria }],
    queryFn: async () => {
      const params = new URLSearchParams({ categoria: categoria || '' });
      const response = await apiRequest(`/api/pre-registered-courses?${params}`);
      return response;
    },
    enabled,
    staleTime: 60_000,        // 1 min "fresco"
    gcTime: 10 * 60_000,      // 10 min - cache mais longo para edição
    placeholderData: (prev) => prev, // Mantém dados durante transições
    refetchOnWindowFocus: false
  });
  
  return Array.isArray(editPreRegisteredCoursesData) ? editPreRegisteredCoursesData : [];
};