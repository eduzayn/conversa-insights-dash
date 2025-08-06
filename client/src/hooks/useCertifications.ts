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

  // Query para buscar certificações
  const { data: certificationsData, isLoading, error: certificationsError, refetch } = useQuery({
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
      
      // Adicionar timestamp para forçar cache refresh
      params.append('_t', Date.now().toString());
      
      const response = await apiRequest(`/api/certificacoes?${params}`);
      return response;
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000)
  });

  // Mutation para criar certificação
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/certificacoes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      toast.success('Certificação criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar certificação');
      console.error('Erro:', error);
    }
  });

  // Mutation para atualizar certificação
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/certificacoes/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      toast.success('Certificação atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar certificação');
      console.error('Erro:', error);
    }
  });

  // Mutation para excluir certificação
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/certificacoes/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificacoes'] });
      toast.success('Certificação excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir certificação');
      console.error('Erro:', error);
    }
  });

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/cursos-pre-cadastrados', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cursos-pre-cadastrados'] });
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
    
    // Loading states
    isLoading,
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

// Query para buscar cursos pré-cadastrados (para criação)
export const usePreRegisteredCourses = (categoria: string) => {
  const { data: preRegisteredCoursesData = [] } = useQuery({
    queryKey: ['/api/cursos-pre-cadastrados', { categoria }],
    queryFn: async () => {
      const params = new URLSearchParams({ categoria });
      const response = await apiRequest(`/api/cursos-pre-cadastrados?${params}`);
      return response;
    }
  });
  
  return Array.isArray(preRegisteredCoursesData) ? preRegisteredCoursesData : [];
};

// Query para buscar cursos pré-cadastrados (para edição)
export const useEditPreRegisteredCourses = (categoria?: string, enabled = false) => {
  const { data: editPreRegisteredCoursesData = [] } = useQuery({
    queryKey: ['/api/cursos-pre-cadastrados-edit', { categoria }],
    queryFn: async () => {
      const params = new URLSearchParams({ categoria: categoria || '' });
      const response = await apiRequest(`/api/cursos-pre-cadastrados?${params}`);
      return response;
    },
    enabled
  });
  
  return Array.isArray(editPreRegisteredCoursesData) ? editPreRegisteredCoursesData : [];
};