
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { atendimentosService } from '@/services/atendimentosService';
import { AtendimentoData, AtendimentosFilters } from '@/types/atendimento';
import { toast } from 'sonner';

export const useAtendimentos = (initialFilters: AtendimentosFilters = {}) => {
  const [filters, setFilters] = useState<AtendimentosFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Query infinita para buscar atendimentos com paginação
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['atendimentos', filters],
    queryFn: ({ pageParam = 1 }) => atendimentosService.getAtendimentos(filters, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 10000, // Considera dados frescos por 10 segundos
    retry: 1,
    retryDelay: 1000,
  });

  // Combinar todas as páginas em uma única lista
  const atendimentos = data?.pages?.flatMap(page => page.data) || [];

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AtendimentoData['status'] }) =>
      atendimentosService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status. Tente novamente.');
    },
  });

  // Mutation para atualizar resultado CRM
  const updateResultadoMutation = useMutation({
    mutationFn: ({ id, resultado }: { id: string; resultado: Atendimento['resultado'] }) =>
      atendimentosService.updateResultado(id, resultado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
      toast.success('Resultado atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar resultado:', error);
      toast.error('Erro ao atualizar resultado. Tente novamente.');
    },
  });

  // Funções de controle
  const updateFilters = useCallback((newFilters: Partial<AtendimentosFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const updateStatus = useCallback((id: string, status: AtendimentoData['status']) => {
    updateStatusMutation.mutate({ id, status });
  }, [updateStatusMutation]);

  const updateResultado = useCallback((id: string, resultado: Atendimento['resultado']) => {
    updateResultadoMutation.mutate({ id, resultado });
  }, [updateResultadoMutation]);

  const exportToCSV = useCallback(() => {
    const headers = ['Nome do Lead', 'Hora', 'Atendente', 'Equipe', 'Duração', 'Status'];
    const csvContent = [
      headers.join(','),
      ...atendimentos.map(item => 
        [item.lead, item.hora, item.atendente, item.equipe, item.duracao, item.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atendimentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  }, [atendimentos]);

  // Auto-refresh quando a aba fica visível novamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch, isLoading]);

  return {
    atendimentos,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    updateStatus,
    updateResultado,
    isUpdatingStatus: updateStatusMutation.isPending,
    refetch,
    exportToCSV,
    // Scroll infinito
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
};
